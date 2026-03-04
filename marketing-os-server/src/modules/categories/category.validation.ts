import { z } from 'zod';

export const createCategorySchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Category name is required').max(100),
        parentCategory: z.string().optional().nullable(),
        status: z.enum(['active', 'inactive']).optional().default('active'),
    }),
});

export const updateCategorySchema = z.object({
    params: z.object({
        id: z.string().min(1, 'Category ID is required'),
    }),
    body: z.object({
        name: z.string().min(1).max(100).optional(),
        parentCategory: z.string().optional().nullable(),
        status: z.enum(['active', 'inactive']).optional(),
    }),
});

export const categoryIdSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'Category ID is required'),
    }),
});
