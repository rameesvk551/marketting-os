import { Request, Response, NextFunction } from 'express';
import * as orderService from './order.service.js';

// ── Order Controller — HTTP Request Handlers ──

export const list = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.context.tenantId;
        const result = await orderService.getAllOrders(tenantId, req.query as any);

        res.json({ status: 'success', ...result });
    } catch (error) {
        next(error);
    }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.context.tenantId;
        const order = await orderService.getOrderById(req.params.id, tenantId);

        res.json({ status: 'success', data: order });
    } catch (error) {
        next(error);
    }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.context.tenantId;
        const userId = req.context.userId || '';
        const order = await orderService.createOrder(tenantId, userId, req.body);

        res.status(201).json({ status: 'success', data: order });
    } catch (error) {
        next(error);
    }
};

export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.context.tenantId;
        const order = await orderService.updateOrderStatus(req.params.id, tenantId, req.body);

        res.json({ status: 'success', data: order });
    } catch (error) {
        next(error);
    }
};

export const stats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.context.tenantId;
        const data = await orderService.getStats(tenantId);

        res.json({ status: 'success', data });
    } catch (error) {
        next(error);
    }
};
