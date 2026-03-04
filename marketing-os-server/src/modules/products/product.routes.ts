import { Router } from 'express';
import * as productController from './product.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
    createProductSchema,
    updateProductSchema,
    productIdSchema,
    productQuerySchema,
    bulkDeleteSchema,
} from './product.validation.js';

export const createProductRouter = (authMiddleware: any) => {
    const router = Router();

    // All routes require authentication
    router.use(authMiddleware());

    // ── Product CRUD ──
    router.get('/', validate(productQuerySchema), productController.list);
    router.post('/', validate(createProductSchema), productController.create);
    router.get('/low-stock', productController.lowStockAlerts);
    router.post('/bulk-delete', validate(bulkDeleteSchema), productController.bulkDelete);
    router.get('/slug/:slug', productController.getBySlug);
    router.get('/:id', validate(productIdSchema), productController.getById);
    router.put('/:id', validate(updateProductSchema), productController.update);
    router.delete('/:id', validate(productIdSchema), productController.remove);
    router.patch('/:id/toggle-status', validate(productIdSchema), productController.toggleStatus);
    router.get('/:id/share', validate(productIdSchema), productController.shareViaWhatsApp);

    return router;
};
