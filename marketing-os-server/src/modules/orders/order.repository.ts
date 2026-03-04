import Order, { IOrder } from '../../db/nosqlmodels/Order.js';
import type { OrderQuery } from './order.types.js';
import type { PaginatedResult } from '../products/product.types.js';

// ── Order Repository — Data Access Layer ──

export const findAll = async (
    tenantId: string,
    query: OrderQuery,
): Promise<PaginatedResult<IOrder>> => {
    const {
        page = 1,
        limit = 20,
        orderStatus,
        paymentStatus,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
    } = query;

    const filter: any = { tenantId };

    if (orderStatus) filter.orderStatus = orderStatus;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (search) {
        filter.$or = [
            { customerName: { $regex: search, $options: 'i' } },
            { phoneNumber: { $regex: search, $options: 'i' } },
            { orderId: { $regex: search, $options: 'i' } },
        ];
    }

    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        Order.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate('products.product', 'productName slug images price')
            .lean(),
        Order.countDocuments(filter),
    ]);

    return {
        data: data as IOrder[],
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};

export const findById = async (
    id: string,
    tenantId: string,
): Promise<IOrder | null> => {
    return Order.findOne({ _id: id, tenantId })
        .populate('products.product', 'productName slug images price')
        .lean();
};

export const create = async (data: Partial<IOrder>): Promise<IOrder> => {
    const order = new Order(data);
    await order.save();
    return order.toObject();
};

export const updateStatus = async (
    id: string,
    tenantId: string,
    data: { orderStatus?: string; paymentStatus?: string },
): Promise<IOrder | null> => {
    return Order.findOneAndUpdate(
        { _id: id, tenantId },
        { $set: data },
        { new: true },
    )
        .populate('products.product', 'productName slug images price')
        .lean();
};

export const getOrderStats = async (tenantId: string) => {
    const stats = await Order.aggregate([
        { $match: { tenantId } },
        {
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalRevenue: { $sum: '$totalAmount' },
                pendingOrders: {
                    $sum: { $cond: [{ $eq: ['$orderStatus', 'pending'] }, 1, 0] },
                },
                paidOrders: {
                    $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] },
                },
            },
        },
    ]);

    return stats[0] || { totalOrders: 0, totalRevenue: 0, pendingOrders: 0, paidOrders: 0 };
};
