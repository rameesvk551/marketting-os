import { Router } from 'express';
import * as categoryController from './category.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createCategorySchema, updateCategorySchema, categoryIdSchema } from './category.validation.js';

export const createCategoryRouter = (authMiddleware: any) => {
    const router = Router();

    router.use(authMiddleware());

    router.get('/', categoryController.list);
    router.get('/active', categoryController.active);
    router.post('/', validate(createCategorySchema), categoryController.create);
    router.get('/:id', validate(categoryIdSchema), categoryController.getById);
    router.put('/:id', validate(updateCategorySchema), categoryController.update);
    router.delete('/:id', validate(categoryIdSchema), categoryController.remove);

    return router;
};
