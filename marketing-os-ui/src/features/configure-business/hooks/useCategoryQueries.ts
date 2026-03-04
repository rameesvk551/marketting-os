import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import * as storeApi from '../services/storeApi';
import type { CategoryQuery, CreateCategoryDTO, UpdateCategoryDTO } from '../types';

export const CATEGORY_KEYS = {
    all: ['categories'] as const,
    lists: () => [...CATEGORY_KEYS.all, 'list'] as const,
    list: (filters: CategoryQuery) => [...CATEGORY_KEYS.lists(), filters] as const,
    details: () => [...CATEGORY_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...CATEGORY_KEYS.details(), id] as const,
};

export const useCategories = (params?: CategoryQuery) => {
    return useQuery({
        queryKey: CATEGORY_KEYS.list(params || {}),
        queryFn: () => storeApi.getCategories(params),
        placeholderData: (previousData) => previousData,
    });
};

export const useCategory = (id: string) => {
    return useQuery({
        queryKey: CATEGORY_KEYS.detail(id),
        queryFn: () => storeApi.getCategoryById(id),
        enabled: !!id,
    });
};

export const useCreateCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateCategoryDTO) => storeApi.createCategory(data),
        onSuccess: () => {
            message.success('Category created successfully');
            queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.lists() });
        },
        onError: (error: any) => {
            message.error(error?.response?.data?.message || 'Failed to create category');
        },
    });
};

export const useUpdateCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateCategoryDTO }) =>
            storeApi.updateCategory(id, data),
        onSuccess: (_, variables) => {
            message.success('Category updated successfully');
            queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.lists() });
            queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.detail(variables.id) });
        },
        onError: (error: any) => {
            message.error(error?.response?.data?.message || 'Failed to update category');
        },
    });
};

export const useDeleteCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => storeApi.deleteCategory(id),
        onSuccess: () => {
            message.success('Category deleted successfully');
            queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.lists() });
        },
        onError: (error: any) => {
            message.error(error?.response?.data?.message || 'Failed to delete category');
        },
    });
};
