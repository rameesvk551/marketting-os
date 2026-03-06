/**
 * Catalog module entry-point router.
 * Builds its own container & middleware, returns a ready-to-mount router.
 */
import { createCatalogContainer } from './container.js';
import { createCatalogRoutes } from './catalog.routes.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { tenantMiddleware } from '../../middlewares/tenant.middleware.js';
import { getPool } from '../../config/database.js';

export function createRouter() {
    const container = createCatalogContainer(getPool());

    return createCatalogRoutes({
        catalogController: container.catalogController,
        authMiddleware: authMiddleware(),
        tenantMiddleware,
    });
}
