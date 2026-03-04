import { z } from 'zod';

export const createOrderSchema = z.object({
    body: z.object({
        customerName: z.string().min(1, 'Customer name is required'),
        phoneNumber: z.string().min(1, 'Phone number is required'),
        products: z.array(z.object({
            product: z.string().min(1, 'Product ID is required'),
            productName: z.string().min(1, 'Product name is required'),
            quantity: z.number().int().min(1, 'Quantity must be at least 1'),
            price: z.number().min(0, 'Price cannot be negative'),
        })).min(1, 'At least one product is required'),
        totalAmount: z.number().min(0, 'Total amount cannot be negative'),
        notes: z.string().optional().default(''),
        source: z.enum(['whatsapp', 'product-link', 'manual']).optional().default('manual'),
    }),
});

export const updateOrderStatusSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'Order ID is required'),
    }),
    body: z.object({
        orderStatus: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']).optional(),
        paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
    }),
});

export const orderIdSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'Order ID is required'),
    }),
});

export const orderQuerySchema = z.object({
    query: z.object({
        page: z.coerce.number().int().min(1).optional().default(1),
        limit: z.coerce.number().int().min(1).max(100).optional().default(20),
        orderStatus: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']).optional(),
        paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
        search: z.string().optional(),
        sortBy: z.string().optional().default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    }),
});
