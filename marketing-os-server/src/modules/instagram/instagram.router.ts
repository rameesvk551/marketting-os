/**
 * Instagram module entry-point router.
 * Builds its own container & middleware, returns a ready-to-mount router.
 */
import { createInstagramContainer } from './container.js';
import { createInstagramRoutes } from './instagram.routes.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { tenantMiddleware } from '../../middlewares/tenant.middleware.js';
import { getPool } from '../../config/database.js';

export function createRouter() {
    const container = createInstagramContainer(getPool());

    return createInstagramRoutes({
        accountController: container.accountController,
        contentPublishController: container.contentPublishController,
        webhookController: container.webhookController,
        inboxController: container.inboxController,
        analyticsController: container.analyticsController,
        authMiddleware: authMiddleware(),
        tenantMiddleware,
    });
}
