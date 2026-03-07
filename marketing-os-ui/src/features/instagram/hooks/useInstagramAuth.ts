// features/instagram/hooks/useInstagramAuth.ts
// React Query hook for Instagram account connection management.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountService } from '../services';
import { message } from 'antd';

const QUERY_KEY = ['instagram', 'connection'];

export function useInstagramAuth() {
    const queryClient = useQueryClient();

    const connectionQuery = useQuery({
        queryKey: QUERY_KEY,
        queryFn: () => accountService.getConnection(),
        staleTime: 60_000,
    });

    const connectMutation = useMutation({
        mutationFn: (payload: { accessToken?: string; igUserId?: string; code?: string; redirectUri?: string }) =>
            accountService.connect(payload),
        onSuccess: () => {
            message.success('Instagram account connected successfully!');
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        },
        onError: (error: any) => {
            message.error(error.response?.data?.message || 'Failed to connect Instagram account');
        },
    });

    const disconnectMutation = useMutation({
        mutationFn: (accountId: string) => accountService.disconnect(accountId),
        onSuccess: () => {
            message.success('Instagram account disconnected');
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        },
        onError: () => {
            message.error('Failed to disconnect account');
        },
    });

    const refreshTokenMutation = useMutation({
        mutationFn: (accountId: string) => accountService.refreshToken(accountId),
        onSuccess: () => {
            message.success('Token refreshed successfully');
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        },
        onError: () => {
            message.error('Failed to refresh token');
        },
    });

    return {
        connection: connectionQuery.data?.data,
        isLoading: connectionQuery.isLoading,
        isConnected: connectionQuery.data?.data?.connected || false,
        accounts: connectionQuery.data?.data?.accounts || [],
        connect: connectMutation.mutate,
        isConnecting: connectMutation.isPending,
        disconnect: disconnectMutation.mutate,
        isDisconnecting: disconnectMutation.isPending,
        refreshToken: refreshTokenMutation.mutate,
        refetch: connectionQuery.refetch,
    };
}
