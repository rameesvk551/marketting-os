import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import * as storeApi from '../services/storeApi';
import type { OrderQuery, UpdateOrderStatusDTO, CreateOrderDTO } from '../types';

export const ORDER_KEYS = {
    all: ['orders'] as const,
    lists: () => [...ORDER_KEYS.all, 'list'] as const,
    list: (filters: OrderQuery) => [...ORDER_KEYS.lists(), filters] as const,
    details: () => [...ORDER_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...ORDER_KEYS.details(), id] as const,
    stats: () => [...ORDER_KEYS.all, 'stats'] as const,
};

export const useOrders = (params?: OrderQuery) => {
    return useQuery({
        queryKey: ORDER_KEYS.list(params || {}),
        queryFn: () => storeApi.getOrders(params),
        placeholderData: (previousData) => previousData,
    });
};

export const useOrder = (id: string) => {
    return useQuery({
        queryKey: ORDER_KEYS.detail(id),
        queryFn: () => storeApi.getOrderById(id),
        enabled: !!id,
    });
};

export const useOrderStats = () => {
    return useQuery({
        queryKey: ORDER_KEYS.stats(),
        queryFn: () => storeApi.getOrderStats(),
    });
};

export const useUpdateOrderStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateOrderStatusDTO }) =>
            storeApi.updateOrderStatus(id, data),
        onSuccess: (_, variables) => {
            message.success('Order status updated successfully');
            queryClient.invalidateQueries({ queryKey: ORDER_KEYS.lists() });
            queryClient.invalidateQueries({ queryKey: ORDER_KEYS.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: ORDER_KEYS.stats() });
        },
        onError: (error: any) => {
            message.error(error?.response?.data?.message || 'Failed to update order status');
        },
    });
};

export const useCreateManualOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateOrderDTO) => storeApi.createOrder(data),
        onSuccess: () => {
            message.success('Order created successfully');
            queryClient.invalidateQueries({ queryKey: ORDER_KEYS.lists() });
            queryClient.invalidateQueries({ queryKey: ORDER_KEYS.stats() });
        },
        onError: (error: any) => {
            message.error(error?.response?.data?.message || 'Failed to create order');
        },
    });
};
