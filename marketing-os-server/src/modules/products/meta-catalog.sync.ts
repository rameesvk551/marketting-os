import fetch from 'node-fetch';
import db from '../../db/sqlmodels/index.js';
import { IProduct } from '../../db/nosqlmodels/Product.js';
// We do not have db/init.js locally on this path, we must fetch pool from the db directly or omit it since Sequelize is used

/**
 * Utility to synchronize products from MongoDB to the Meta Graph API Catalog.
 * It dynamically fetches the tenant's Meta Access Token and Catalog ID.
 */
export class MetaCatalogSyncService {
    
    /**
     * Gets the Meta Access Token from the User table for the given tenant.
     * Takes the first user that has a metaAccessToken.
     */
    private static async getMetaAccessToken(tenantId: string): Promise<string | null> {
        try {
            // Find a user belonging to this tenant that has a meta_access_token
            const user = await db.User.findOne({
                where: { tenant_id: tenantId },
                attributes: ['metaAccessToken'] // Make sure to use the model's mapped attribute name
            });
            return user?.metaAccessToken || null;
        } catch (error) {
            console.error('[MetaCatalogSync] Error fetching token:', error);
            return null;
        }
    }

    /**
     * Gets the Catalog ID associated with the tenant.
     * Tries whatsapp_business_configs first, then falls back to catalog_configs.
     */
    private static async getCatalogId(tenantId: string): Promise<string | null> {
        try {
            // First try WhatsAppBusinessConfig via Sequelize
            const waConfig = await db.WhatsappBusinessConfig.findOne({
                where: { tenant_id: tenantId, status: 'active' },
                order: [['created_at', 'DESC']]
            });
            if (waConfig && waConfig.catalog_id) {
                return waConfig.catalog_id;
            }

            // Fallback to CatalogConfig via Sequelize
            const catalogConfig = await db.CatalogConfig.findOne({
                where: { tenant_id: tenantId, status: 'active' },
                order: [['created_at', 'DESC']]
            });
            if (catalogConfig && catalogConfig.catalog_id) {
                return catalogConfig.catalog_id;
            }

            return null;
        } catch (error) {
            console.error('[MetaCatalogSync] Error fetching catalog ID:', error);
            return null;
        }
    }

    /**
     * Pushes a single product update to Meta Catalog via the Batch API.
     * @param tenantId The Tenant ID
     * @param product The product document from MongoDB
     * @param method CREATE, UPDATE, or DELETE
     */
    public static async syncProduct(tenantId: string, product: IProduct, method: 'CREATE' | 'UPDATE' | 'DELETE') {
        try {
            // 1. Fetch Credentials
            const accessToken = await this.getMetaAccessToken(tenantId);
            const catalogId = await this.getCatalogId(tenantId);

            if (!accessToken || !catalogId) {
                console.log(`[MetaCatalogSync] Skipping sync for product ${product._id}: Missing Access Token or Catalog ID for tenant ${tenantId}.`);
                return;
            }

            // 2. Format the Request Body for the Batch API
            // Note: product._id is typically an ObjectId. toString() is necessary.
            // But we use mapping logic: Meta requires SKU format (as diagnosed previously) or fallback to ID
            const retailerId = product.sku || (product as any)._id?.toString() || (product as any).id?.toString();

            if (!retailerId) {
                console.warn('[MetaCatalogSync] Product missing identifier (sku or _id). Cannot sync.');
                return;
            }

            const requestPayload: any = {
                method: method,
                data: {
                    id: retailerId, // This acts as the 'retailer_id' inside the batch API
                }
            };

            // Only attach full data if we are creating or updating
            if (method !== 'DELETE') {
                requestPayload.data = {
                    ...requestPayload.data,
                    title: product.productName || 'Unnamed Product',
                    description: product.description ? product.description.substring(0, 500) : 'Product description',
                    availability: product.stockQuantity > 0 ? 'in stock' : 'out of stock',
                    condition: 'new',
                    // Meta expects price in the format: "<amount> <CURRENCY_CODE>"
                    price: `${(product.price * 100).toFixed(0)} INR`, // using standard INR formatting
                    link: (product as any).thumbnailImage || 'https://google.com',
                    image_link: (product as any).thumbnailImage || 'https://via.placeholder.com/500',
                    brand: 'Store' // Required by Meta usually
                };
            }

            const body = {
                item_type: 'PRODUCT_ITEM',
                requests: [requestPayload]
            };

            // 3. Send out to Meta
            console.log(`[MetaCatalogSync] Sending ${method} for ${retailerId} to Catalog ${catalogId}...`);
            const res = await fetch(`https://graph.facebook.com/v24.0/${catalogId}/items_batch?access_token=${accessToken}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data: any = await res.json();
            
            if (!res.ok) {
                console.error('[MetaCatalogSync] Meta API Error:', JSON.stringify(data, null, 2));
            } else {
                console.log(`[MetaCatalogSync] Successfully queued ${method} for ${retailerId}. Handles:`, data.handles);
            }

        } catch (error) {
            // We catch all errors so that a failure in Facebook sync never crashes the creation of a product in the local DB.
            console.error(`[MetaCatalogSync] Fatal error syncing product ${product._id}:`, error);
        }
    }
}
