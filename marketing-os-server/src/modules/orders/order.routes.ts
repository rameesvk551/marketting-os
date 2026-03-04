import { Router } from 'express';
import * as orderController from './order.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createOrderSchema, updateOrderStatusSchema, orderIdSchema, orderQuerySchema } from './order.validation.js';

export const createOrderRouter = (authMiddleware: any) => {
    const router = Router();

    router.use(authMiddleware());

    router.get('/', validate(orderQuerySchema), orderController.list);
    router.get('/stats', orderController.stats);
    router.post('/', validate(createOrderSchema), orderController.create);
    router.get('/:id', validate(orderIdSchema), orderController.getById);
    router.patch('/:id/status', validate(updateOrderStatusSchema), orderController.updateStatus);

    return router;
};
