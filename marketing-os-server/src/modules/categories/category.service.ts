import * as categoryRepo from './category.repository.js';
import type { CreateCategoryDTO, UpdateCategoryDTO } from './category.types.js';
import Category, { ICategory } from '../../db/nosqlmodels/Category.js';
import { UpdateQuery } from 'mongoose';

// ── Category Service — Business Logic Layer ──

export const getAllCategories = async (
    tenantId: string,
    query: { status?: string; parent?: string },
): Promise<ICategory[]> => {
    return categoryRepo.findAll(tenantId, query);
};

export const getCategoryById = async (
    id: string,
    tenantId: string,
): Promise<ICategory> => {
    const category = await categoryRepo.findById(id, tenantId);
    if (!category) {
        throw Object.assign(new Error('Category not found'), { statusCode: 404 });
    }
    return category;
};

export const createCategory = async (
    tenantId: string,
    data: CreateCategoryDTO,
): Promise<ICategory> => {
    return categoryRepo.create({ ...data, tenantId } as any);
};

export const updateCategory = async (
    id: string,
    tenantId: string,
    data: UpdateCategoryDTO,
): Promise<ICategory> => {
    const category = await categoryRepo.update(id, tenantId, data);
    if (!category) {
        throw Object.assign(new Error('Category not found'), { statusCode: 404 });
    }
    return category;
};

export const deleteCategory = async (
    id: string,
    tenantId: string,
): Promise<void> => {
    const result = await categoryRepo.softDelete(id, tenantId);
    if (!result) {
        throw Object.assign(new Error('Category not found'), { statusCode: 404 });
    }
};

export const getActiveCategories = async (tenantId: string): Promise<ICategory[]> => {
    return categoryRepo.findActiveCategories(tenantId);
};
