// controllers/CatalogController.ts
// HTTP request handlers for the Catalog module.

import { Request, Response, NextFunction } from 'express';
import type { IMetaCatalogService } from '../services/MetaCatalogService.js';

export function createCatalogController(catalogService: IMetaCatalogService) {
    return {
        /** GET /catalog/config — get catalog connection status */
        async getConfig(req: Request, res: Response, next: NextFunction) {
            try {
                const tenantId = req.context.tenantId;
                const config = await catalogService.getConfig(tenantId);

                res.json({
                    status: 'success',
                    data: config
                        ? {
                            id: config.id,
                            catalogId: config.catalogId,
                            businessId: config.businessId,
                            catalogName: config.catalogName,
                            autoSyncEnabled: config.autoSyncEnabled,
                            lastSyncAt: config.lastSyncAt,
                            connectionStatus: config.status,
                            createdAt: config.createdAt,
                        }
                        : null,
                });
            } catch (error) {
                next(error);
            }
        },

        /** POST /catalog/connect — connect a Meta Catalog */
        async connect(req: Request, res: Response, next: NextFunction) {
            try {
                const tenantId = req.context.tenantId;
                const { catalogId, businessId, catalogName, accessToken } = req.body;

                if (!catalogId || !businessId || !accessToken) {
                    res.status(400).json({
                        status: 'error',
                        message: 'catalogId, businessId, and accessToken are required',
                    });
                    return;
                }

                const config = await catalogService.connect(tenantId, {
                    catalogId,
                    businessId,
                    catalogName,
                    accessToken,
                });

                res.status(201).json({
                    status: 'success',
                    data: {
                        id: config.id,
                        catalogId: config.catalogId,
                        businessId: config.businessId,
                        catalogName: config.catalogName,
                        connectionStatus: config.status,
                    },
                });
            } catch (error) {
                next(error);
            }
        },

        /** DELETE /catalog/disconnect/:configId — disconnect catalog */
        async disconnect(req: Request, res: Response, next: NextFunction) {
            try {
                const tenantId = req.context.tenantId;
                await catalogService.disconnect(tenantId, req.params.configId);

                res.json({ status: 'success', message: 'Catalog disconnected' });
            } catch (error) {
                next(error);
            }
        },

        /** GET /catalog/catalogs — list available catalogs from Meta */
        async listCatalogs(req: Request, res: Response, next: NextFunction) {
            try {
                const tenantId = req.context.tenantId;
                const { businessId, accessToken } = req.query as { businessId: string; accessToken: string };

                if (!businessId || !accessToken) {
                    res.status(400).json({
                        status: 'error',
                        message: 'businessId and accessToken query params are required',
                    });
                    return;
                }

                const catalogs = await catalogService.getCatalogs(tenantId, businessId, accessToken);
                res.json({ status: 'success', data: catalogs });
            } catch (error) {
                next(error);
            }
        },

        /** POST /catalog/sync — trigger full product sync */
        async syncAll(req: Request, res: Response, next: NextFunction) {
            try {
                const tenantId = req.context.tenantId;
                const result = await catalogService.syncAllProducts(tenantId);

                res.json({
                    status: 'success',
                    data: result,
                    message: `Sync completed: ${result.syncedCount} synced, ${result.failedCount} failed`,
                });
            } catch (error) {
                next(error);
            }
        },

        /** POST /catalog/sync/:productId — sync single product */
        async syncProduct(req: Request, res: Response, next: NextFunction) {
            try {
                const tenantId = req.context.tenantId;
                const result = await catalogService.syncSingleProduct(tenantId, req.params.productId);

                res.json({ status: 'success', data: result });
            } catch (error) {
                next(error);
            }
        },

        /** GET /catalog/sync-logs — get sync history */
        async getSyncLogs(req: Request, res: Response, next: NextFunction) {
            try {
                const tenantId = req.context.tenantId;
                const limit = req.query.limit ? Number(req.query.limit) : 20;
                const logs = await catalogService.getSyncLogs(tenantId, limit);

                res.json({ status: 'success', data: logs });
            } catch (error) {
                next(error);
            }
        },

        /** GET /catalog/products — list products in Meta Catalog */
        async getProducts(req: Request, res: Response, next: NextFunction) {
            try {
                const tenantId = req.context.tenantId;
                const products = await catalogService.getCatalogProducts(tenantId);

                res.json({ status: 'success', data: products });
            } catch (error) {
                next(error);
            }
        },
    };
}
