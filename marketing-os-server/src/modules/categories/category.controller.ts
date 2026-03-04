import { Request, Response, NextFunction } from 'express';
import * as categoryService from './category.service.js';

// ── Category Controller — HTTP Request Handlers ──

export const list = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.context.tenantId;
        const categories = await categoryService.getAllCategories(tenantId, req.query as any);

        res.json({ status: 'success', data: categories });
    } catch (error) {
        next(error);
    }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.context.tenantId;
        const category = await categoryService.getCategoryById(req.params.id, tenantId);

        res.json({ status: 'success', data: category });
    } catch (error) {
        next(error);
    }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.context.tenantId;
        const category = await categoryService.createCategory(tenantId, req.body);

        res.status(201).json({ status: 'success', data: category });
    } catch (error) {
        next(error);
    }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.context.tenantId;
        const category = await categoryService.updateCategory(req.params.id, tenantId, req.body);

        res.json({ status: 'success', data: category });
    } catch (error) {
        next(error);
    }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.context.tenantId;
        await categoryService.deleteCategory(req.params.id, tenantId);

        res.json({ status: 'success', message: 'Category deleted successfully' });
    } catch (error) {
        next(error);
    }
};

export const active = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.context.tenantId;
        const categories = await categoryService.getActiveCategories(tenantId);

        res.json({ status: 'success', data: categories });
    } catch (error) {
        next(error);
    }
};
