import * as orderRepo from './order.repository.js';
import type { CreateOrderDTO, UpdateOrderStatusDTO, OrderQuery } from './order.types.js';
import type { PaginatedResult } from '../products/product.types.js';
import { IOrder } from '../../db/nosqlmodels/Order.js';
import { Types } from 'mongoose';

// ── Order Service — Business Logic Layer ──

export const getAllOrders = async (
    tenantId: string,
    query: OrderQuery,
): Promise<PaginatedResult<IOrder>> => {
    return orderRepo.findAll(tenantId, query);
};

export const getOrderById = async (
    id: string,
    tenantId: string,
): Promise<IOrder> => {
    const order = await orderRepo.findById(id, tenantId);
    if (!order) {
        throw Object.assign(new Error('Order not found'), { statusCode: 404 });
    }
    return order;
};

export const createOrder = async (
    tenantId: string,
    createdBy: string,
    data: CreateOrderDTO,
): Promise<IOrder> => {
    const formattedProducts = data.products.map(p => ({
        ...p,
        product: new Types.ObjectId(p.product)
    }));
    return orderRepo.create({
        ...data,
        products: formattedProducts as any,
        tenantId,
        createdBy,
    });
};

export const updateOrderStatus = async (
    id: string,
    tenantId: string,
    data: UpdateOrderStatusDTO,
): Promise<IOrder> => {
    const order = await orderRepo.updateStatus(id, tenantId, data);
    if (!order) {
        throw Object.assign(new Error('Order not found'), { statusCode: 404 });
    }
    return order;
};

export const getStats = async (tenantId: string) => {
    return orderRepo.getOrderStats(tenantId);
};
