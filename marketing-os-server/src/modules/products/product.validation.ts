import { z } from 'zod';

export const createProductSchema = z.object({
    body: z.object({
        productName: z.string().min(1, 'Product name is required').max(200),
        description: z.string().optional().default(''),
        shortDescription: z.string().max(500).optional().default(''),
        price: z.number().min(0, 'Price cannot be negative'),
        discountPrice: z.number().min(0).optional().nullable(),
        currency: z.string().max(5).optional().default('INR'),
        sku: z.string().optional().default(''),
        stockQuantity: z.number().int().min(0).optional().default(0),
        images: z.array(z.string()).optional().default([]),
        category: z.string().optional().nullable(),
        tags: z.array(z.string()).optional().default([]),
        status: z.enum(['active', 'draft', 'out-of-stock']).optional().default('draft'),
        isFeatured: z.boolean().optional().default(false),
    }),
});

export const updateProductSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'Product ID is required'),
    }),
    body: z.object({
        productName: z.string().min(1).max(200).optional(),
        description: z.string().optional(),
        shortDescription: z.string().max(500).optional(),
        price: z.number().min(0).optional(),
        discountPrice: z.number().min(0).optional().nullable(),
        currency: z.string().max(5).optional(),
        sku: z.string().optional(),
        stockQuantity: z.number().int().min(0).optional(),
        images: z.array(z.string()).optional(),
        category: z.string().optional().nullable(),
        tags: z.array(z.string()).optional(),
        status: z.enum(['active', 'draft', 'out-of-stock']).optional(),
        isFeatured: z.boolean().optional(),
    }),
});

export const productIdSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'Product ID is required'),
    }),
});

export const productQuerySchema = z.object({
    query: z.object({
        page: z.coerce.number().int().min(1).optional().default(1),
        limit: z.coerce.number().int().min(1).max(100).optional().default(20),
        search: z.string().optional(),
        category: z.string().optional(),
        status: z.enum(['active', 'draft', 'out-of-stock']).optional(),
        isFeatured: z.coerce.boolean().optional(),
        sortBy: z.string().optional().default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    }),
});

export const bulkDeleteSchema = z.object({
    body: z.object({
        ids: z.array(z.string().min(1)).min(1, 'At least one ID is required'),
    }),
});
