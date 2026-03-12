// services/MetaCatalogService.ts
// Core catalog service — maps Marketing-OS products to Meta Catalog format
// and orchestrates batch sync operations.

import { IProduct } from '../../../db/nosqlmodels/Product.js';
import Product from '../../../db/nosqlmodels/Product.js';
import { logger } from '../../../config/logger.js';
import type { IMetaCatalogApiProvider, BatchRequest } from '../providers/MetaCatalogApiProvider.js';
import type { ICatalogConfigRepo } from '../repositories/CatalogConfigRepo.js';
import type { ICatalogSyncLogRepo } from '../repositories/CatalogSyncLogRepo.js';
import type { CatalogConfig } from '../models/CatalogConfig.js';
import type { CatalogSyncLog } from '../models/CatalogSyncLog.js';

export interface IMetaCatalogService {
    // Connection
    getConfig(tenantId: string): Promise<CatalogConfig | null>;
    connect(tenantId: string, data: { catalogId: string; businessId: string; catalogName?: string; accessToken: string }): Promise<CatalogConfig>;
    disconnect(tenantId: string, configId: string): Promise<void>;
    getCatalogs(tenantId: string, businessId: string, accessToken: string): Promise<any[]>;

    // Sync
    syncAllProducts(tenantId: string): Promise<CatalogSyncLog>;
    syncSingleProduct(tenantId: string, productId: string): Promise<CatalogSyncLog>;
    deleteProductFromCatalog(tenantId: string, productId: string): Promise<void>;

    // Logs
    getSyncLogs(tenantId: string, limit?: number): Promise<CatalogSyncLog[]>;

    // Catalog products
    getCatalogProducts(tenantId: string): Promise<any[]>;
}

// ── Product → Meta Catalog Field Mapper ──

function mapProductToMetaFormat(product: IProduct, storefrontUrl?: string): Record<string, any> {
    const productId = product.sku || (product as any)._id?.toString() || '';
    const price = product.discountPrice && product.discountPrice < product.price
        ? product.discountPrice
        : product.price;
    const currency = product.currency || 'INR';

    // Availability mapping
    let availability = 'in stock';
    if (product.status === 'out-of-stock' || product.stockQuantity <= 0) {
        availability = 'out of stock';
    } else if (product.status === 'draft') {
        availability = 'out of stock'; // drafts shouldn't appear
    }

    const link = storefrontUrl
        ? `${storefrontUrl}/product/${product.slug}`
        : `${process.env.FRONTEND_URL || 'https://wayon.in'}/product/${product.slug}`;

    const mapped: Record<string, any> = {
        id: productId,
        title: product.productName,
        description: product.description || product.shortDescription || product.productName,
        availability,
        condition: 'new',
        price: `${price.toFixed(2)} ${currency}`,
        link,
        image_link: product.images?.[0] || '',
        brand: 'Store', // Default brand, can be customized
    };

    // Sale price
    if (product.discountPrice && product.discountPrice < product.price) {
        mapped.sale_price = `${product.discountPrice.toFixed(2)} ${currency}`;
    }

    // Additional images (up to 20)
    if (product.images && product.images.length > 1) {
        mapped.additional_image_link = product.images.slice(1, 21).join(',');
    }

    // Stock quantity
    if (product.stockQuantity !== undefined) {
        mapped.quantity_to_sell_on_facebook = product.stockQuantity;
    }

    return mapped;
}

// ── Service Factory ──

export function createMetaCatalogService(
    configRepo: ICatalogConfigRepo,
    syncLogRepo: ICatalogSyncLogRepo,
    createProvider: (accessToken: string, apiVersion: string) => IMetaCatalogApiProvider,
    apiVersion: string,
): IMetaCatalogService {

    async function getActiveConfig(tenantId: string): Promise<CatalogConfig> {
        const configs = await configRepo.findByTenant(tenantId);
        const active = configs.find(c => c.status === 'active');
        if (!active) {
            throw Object.assign(new Error('No active catalog connected. Please connect a Meta Catalog first.'), { statusCode: 400 });
        }
        return active;
    }

    return {
        async getConfig(tenantId: string): Promise<CatalogConfig | null> {
            const configs = await configRepo.findByTenant(tenantId);
            return configs[0] || null;
        },

        async connect(tenantId: string, data) {
            logger.info(`[Catalog] Connecting catalog ${data.catalogId} for tenant ${tenantId}`);
            return configRepo.save({
                tenantId,
                catalogId: data.catalogId,
                businessId: data.businessId,
                catalogName: data.catalogName,
                accessToken: data.accessToken,
            });
        },

        async disconnect(tenantId: string, configId: string) {
            logger.info(`[Catalog] Disconnecting catalog config ${configId} for tenant ${tenantId}`);
            await configRepo.delete(configId, tenantId);
        },

        async getCatalogs(tenantId: string, businessId: string, accessToken: string) {
            const provider = createProvider(accessToken, apiVersion);
            return provider.getCatalogs(businessId);
        },

        async syncAllProducts(tenantId: string): Promise<CatalogSyncLog> {
            const config = await getActiveConfig(tenantId);
            const provider = createProvider(config.accessToken, apiVersion);

            // Fetch all active products from MongoDB
            const products = await Product.find({
                tenantId,
                isDeleted: false,
                status: { $ne: 'draft' },
            }).lean() as IProduct[];

            // Create sync log
            const syncLog = await syncLogRepo.create({
                tenantId,
                catalogId: config.catalogId,
                syncType: 'full',
                totalProducts: products.length,
            });

            if (products.length === 0) {
                await syncLogRepo.update(syncLog.id, {
                    status: 'completed',
                    completedAt: new Date(),
                });
                return { ...syncLog, status: 'completed', completedAt: new Date() } as CatalogSyncLog;
            }

            try {
                // Build batch requests (max 5000 per batch)
                const batchSize = 4999;
                let synced = 0;
                let failed = 0;
                const allErrors: any[] = [];

                for (let i = 0; i < products.length; i += batchSize) {
                    const batch = products.slice(i, i + batchSize);
                    const requests: BatchRequest[] = batch.map(product => ({
                        method: 'CREATE' as const, // CREATE acts as upsert in Meta Batch API
                        data: mapProductToMetaFormat(product),
                    }));

                    try {
                        await provider.batchProducts(config.catalogId, requests);
                        synced += batch.length;
                    } catch (err: any) {
                        failed += batch.length;
                        allErrors.push({
                            batch: Math.floor(i / batchSize) + 1,
                            error: err.message,
                        });
                        logger.error(`[Catalog] Batch sync error: ${err.message}`);
                    }
                }

                // Update sync log
                const finalStatus = failed === 0 ? 'completed' : (synced > 0 ? 'completed' : 'failed');
                await syncLogRepo.update(syncLog.id, {
                    status: finalStatus as any,
                    syncedCount: synced,
                    failedCount: failed,
                    errors: allErrors,
                    completedAt: new Date(),
                });

                // Update last sync timestamp
                await configRepo.update(config.id, { lastSyncAt: new Date() });

                logger.info(`[Catalog] Full sync completed: ${synced} synced, ${failed} failed`);

                return {
                    ...syncLog,
                    status: finalStatus,
                    syncedCount: synced,
                    failedCount: failed,
                    errors: allErrors,
                    completedAt: new Date(),
                } as CatalogSyncLog;
            } catch (err: any) {
                await syncLogRepo.update(syncLog.id, {
                    status: 'failed',
                    errors: [{ error: err.message }],
                    completedAt: new Date(),
                });
                throw err;
            }
        },

        async syncSingleProduct(tenantId: string, productId: string): Promise<CatalogSyncLog> {
            const config = await getActiveConfig(tenantId);
            const provider = createProvider(config.accessToken, apiVersion);

            const product = await Product.findOne({
                _id: productId,
                tenantId,
                isDeleted: false,
            }).lean() as IProduct | null;

            if (!product) {
                throw Object.assign(new Error('Product not found'), { statusCode: 404 });
            }

            const syncLog = await syncLogRepo.create({
                tenantId,
                catalogId: config.catalogId,
                syncType: 'single',
                totalProducts: 1,
            });

            try {
                const metaData = mapProductToMetaFormat(product);
                await provider.batchProducts(config.catalogId, [
                    { method: 'CREATE', data: metaData },
                ]);

                await syncLogRepo.update(syncLog.id, {
                    status: 'completed',
                    syncedCount: 1,
                    completedAt: new Date(),
                });

                return { ...syncLog, status: 'completed', syncedCount: 1, completedAt: new Date() } as CatalogSyncLog;
            } catch (err: any) {
                await syncLogRepo.update(syncLog.id, {
                    status: 'failed',
                    failedCount: 1,
                    errors: [{ productId, error: err.message }],
                    completedAt: new Date(),
                });
                throw err;
            }
        },

        async deleteProductFromCatalog(tenantId: string, productId: string): Promise<void> {
            const config = await getActiveConfig(tenantId);
            const provider = createProvider(config.accessToken, apiVersion);

            const product = await Product.findOne({ _id: productId, tenantId }).lean() as IProduct | null;
            const retailerId = product?.sku || productId;

            await provider.batchProducts(config.catalogId, [
                { method: 'DELETE', data: { id: retailerId } },
            ]);

            logger.info(`[Catalog] Deleted product ${retailerId} from catalog ${config.catalogId}`);
        },

        async getSyncLogs(tenantId: string, limit = 20): Promise<CatalogSyncLog[]> {
            return syncLogRepo.findByTenant(tenantId, limit);
        },

        async getCatalogProducts(tenantId: string): Promise<any[]> {
            const config = await getActiveConfig(tenantId);
            const provider = createProvider(config.accessToken, apiVersion);
            return provider.getProducts(config.catalogId);
        },
    };
}
