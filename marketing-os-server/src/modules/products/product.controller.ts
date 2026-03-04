import { Request, Response, NextFunction } from 'express';
import * as productService from './product.service.js';

// ── Product Controller — HTTP Request Handlers ──

export const list = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.context.tenantId;
        const result = await productService.getAllProducts(tenantId, req.query as any);

        res.json({
            status: 'success',
            ...result,
        });
    } catch (error) {
        next(error);
    }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.context.tenantId;
        const product = await productService.getProductById(req.params.id, tenantId);

        res.json({ status: 'success', data: product });
    } catch (error) {
        next(error);
    }
};

export const getBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.context.tenantId;
        const product = await productService.getProductBySlug(req.params.slug, tenantId);

        res.json({ status: 'success', data: product });
    } catch (error) {
        next(error);
    }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.context.tenantId;
        const userId = req.context.userId!;
        const product = await productService.createProduct(tenantId, userId, req.body);

        res.status(201).json({ status: 'success', data: product });
    } catch (error) {
        next(error);
    }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.context.tenantId;
        const product = await productService.updateProduct(req.params.id, tenantId, req.body);

        res.json({ status: 'success', data: product });
    } catch (error) {
        next(error);
    }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.context.tenantId;
        await productService.deleteProduct(req.params.id, tenantId);

        res.json({ status: 'success', message: 'Product deleted successfully' });
    } catch (error) {
        next(error);
    }
};

export const bulkDelete = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.context.tenantId;
        const count = await productService.bulkDeleteProducts(req.body.ids, tenantId);

        res.json({ status: 'success', message: `${count} products deleted`, data: { deletedCount: count } });
    } catch (error) {
        next(error);
    }
};

export const toggleStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.context.tenantId;
        const product = await productService.toggleProductStatus(req.params.id, tenantId);

        res.json({ status: 'success', data: product });
    } catch (error) {
        next(error);
    }
};

export const shareViaWhatsApp = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.context.tenantId;
        const product = await productService.getProductById(req.params.id, tenantId);
        const businessSlug = tenantId; // Can be replaced with actual business slug
        const message = productService.generateWhatsAppShareMessage(product, businessSlug);

        await productService.trackProductClick(req.params.id);

        res.json({ status: 'success', data: { message, whatsappUrl: `https://wa.me/?text=${encodeURIComponent(message)}` } });
    } catch (error) {
        next(error);
    }
};

export const lowStockAlerts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.context.tenantId;
        const threshold = req.query.threshold ? Number(req.query.threshold) : 5;
        const products = await productService.getLowStockAlerts(tenantId, threshold);

        res.json({ status: 'success', data: products });
    } catch (error) {
        next(error);
    }
};
