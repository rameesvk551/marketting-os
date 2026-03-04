import { Router } from 'express';
import { createProductRouter } from '../products/product.routes.js';
import { createCategoryRouter } from '../categories/category.routes.js';
import { createOrderRouter } from '../orders/order.routes.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

/**
 * Store module router.
 * Mounts products, categories, and orders under /api/v1/store/*
 */
export const createStoreRouter = () => {
    const router = Router();

    router.use('/products', createProductRouter(authMiddleware));
    router.use('/categories', createCategoryRouter(authMiddleware));
    router.use('/orders', createOrderRouter(authMiddleware));

    return router;
};
