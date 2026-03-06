// features/catalog/hooks/useCatalog.ts
// React Query hooks for catalog operations.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { catalogService } from '../services/catalogService';
import { message } from 'antd';

const QUERY_KEYS = {
    config: ['catalog', 'config'],
    syncLogs: ['catalog', 'sync-logs'],
    products: ['catalog', 'products'],
};

/** Get catalog connection config */
export function useCatalogConfig() {
    return useQuery({
        queryKey: QUERY_KEYS.config,
        queryFn: () => catalogService.getConfig(),
    });
}

/** Get sync logs */
export function useSyncLogs(limit?: number) {
    return useQuery({
        queryKey: [...QUERY_KEYS.syncLogs, limit],
        queryFn: () => catalogService.getSyncLogs(limit),
    });
}

/** Get catalog products from Meta */
export function useCatalogProducts() {
    return useQuery({
        queryKey: QUERY_KEYS.products,
        queryFn: () => catalogService.getProducts(),
        enabled: false, // Manual trigger
    });
}

/** Connect a Meta Catalog */
export function useConnectCatalog() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: { catalogId: string; businessId: string; catalogName?: string; accessToken: string }) =>
            catalogService.connect(payload),
        onSuccess: () => {
            message.success('Catalog connected successfully!');
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.config });
        },
        onError: (err: any) => {
            message.error(err?.response?.data?.message || 'Failed to connect catalog');
        },
    });
}

/** Disconnect catalog */
export function useDisconnectCatalog() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (configId: string) => catalogService.disconnect(configId),
        onSuccess: () => {
            message.success('Catalog disconnected');
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.config });
        },
        onError: (err: any) => {
            message.error(err?.response?.data?.message || 'Failed to disconnect catalog');
        },
    });
}

/** Sync all products to Meta Catalog */
export function useSyncAllProducts() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => catalogService.syncAll(),
        onSuccess: (data: any) => {
            message.success(data?.message || 'Products synced successfully!');
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.syncLogs });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.config });
        },
        onError: (err: any) => {
            message.error(err?.response?.data?.message || 'Sync failed');
        },
    });
}

/** Sync a single product */
export function useSyncProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (productId: string) => catalogService.syncProduct(productId),
        onSuccess: () => {
            message.success('Product synced!');
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.syncLogs });
        },
        onError: (err: any) => {
            message.error(err?.response?.data?.message || 'Failed to sync product');
        },
    });
}
