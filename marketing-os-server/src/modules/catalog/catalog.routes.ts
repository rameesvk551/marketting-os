// catalog.routes.ts
// Route definitions for the Catalog module with dependency injection.

import { Router, Request, Response, NextFunction } from 'express';
import { createCatalogController } from './controllers/CatalogController.js';

/** Rate limiter — pass-through stub (implement with Redis in production) */
const apiRateLimiter = (_req: Request, _res: Response, next: NextFunction) => next();

/**
 * Create Catalog routes with dependency injection
 */
export function createCatalogRoutes(dependencies: {
    catalogController: ReturnType<typeof createCatalogController>;
    authMiddleware: (req: any, res: any, next: any) => void;
    tenantMiddleware: (req: any, res: any, next: any) => void;
}): Router {
    const router = Router();
    const { catalogController, authMiddleware, tenantMiddleware } = dependencies;

    // ============================================
    // ALL ROUTES REQUIRE AUTHENTICATION
    // ============================================

    router.use(authMiddleware);
    router.use(tenantMiddleware);
    router.use(apiRateLimiter);

    // ── Connection Management ──
    router.get('/config', catalogController.getConfig);
    router.post('/connect', catalogController.connect);
    router.delete('/disconnect/:configId', catalogController.disconnect);

    // ── Browse Available Catalogs ──
    router.get('/catalogs', catalogController.listCatalogs);

    // ── Sync Operations ──
    router.post('/sync', catalogController.syncAll);
    router.post('/sync/:productId', catalogController.syncProduct);

    // ── Sync Logs ──
    router.get('/sync-logs', catalogController.getSyncLogs);

    // ── Catalog Products (from Meta) ──
    router.get('/products', catalogController.getProducts);

    // ── Health Check ──
    router.get('/health', async (_req, res) => {
        res.json({
            status: 'ok',
            module: 'catalog',
            timestamp: new Date().toISOString(),
        });
    });

    return router;
}

export default createCatalogRoutes;
