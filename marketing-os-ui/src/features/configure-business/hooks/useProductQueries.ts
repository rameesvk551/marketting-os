import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import * as storeApi from '../services/storeApi';
import type { ProductQuery, CreateProductDTO, UpdateProductDTO } from '../types';

export const PRODUCT_KEYS = {
    all: ['products'] as const,
    lists: () => [...PRODUCT_KEYS.all, 'list'] as const,
    list: (filters: ProductQuery) => [...PRODUCT_KEYS.lists(), filters] as const,
    details: () => [...PRODUCT_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...PRODUCT_KEYS.details(), id] as const,
};

export const useProducts = (params?: ProductQuery) => {
    return useQuery({
        queryKey: PRODUCT_KEYS.list(params || {}),
        queryFn: () => storeApi.getProducts(params),
        placeholderData: (previousData) => previousData,
    });
};

export const useProduct = (id: string) => {
    return useQuery({
        queryKey: PRODUCT_KEYS.detail(id),
        queryFn: () => storeApi.getProductById(id),
        enabled: !!id,
    });
};

export const useCreateProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateProductDTO) => storeApi.createProduct(data),
        onSuccess: () => {
            message.success('Product created successfully');
            queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() });
        },
        onError: (error: any) => {
            message.error(error?.response?.data?.message || 'Failed to create product');
        },
    });
};

export const useUpdateProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateProductDTO }) =>
            storeApi.updateProduct(id, data),
        onSuccess: (_, variables) => {
            message.success('Product updated successfully');
            queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() });
            queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.detail(variables.id) });
        },
        onError: (error: any) => {
            message.error(error?.response?.data?.message || 'Failed to update product');
        },
    });
};

export const useDeleteProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => storeApi.deleteProduct(id),
        onSuccess: () => {
            message.success('Product deleted successfully');
            queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() });
        },
        onError: (error: any) => {
            message.error(error?.response?.data?.message || 'Failed to delete product');
        },
    });
};

export const useToggleProductStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: 'active' | 'draft' | 'out-of-stock' }) =>
            storeApi.toggleProductStatus(id, status),
        onSuccess: (_, variables) => {
            message.success('Product status updated');
            queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() });
            queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.detail(variables.id) });
        },
        onError: (error: any) => {
            message.error(error?.response?.data?.message || 'Failed to update status');
        },
    });
};

export const useGenerateWhatsAppShare = () => {
    return useMutation({
        mutationFn: (id: string) => storeApi.generateWhatsAppShareLink(id),
        onError: (error: any) => {
            message.error(error?.response?.data?.message || 'Failed to generate share link');
        },
    });
};
