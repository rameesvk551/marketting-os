// features/instagram/services/accountService.ts
// Domain service for Instagram account operations.

import { instagramApi } from '../api/instagramApi';

export const accountService = {
    getConnection: () => instagramApi.getConnection(),
    connect: (payload: { accessToken?: string; code?: string; redirectUri?: string }) => instagramApi.connect(payload),
    disconnect: (accountId: string) => instagramApi.disconnect(accountId),
    getProfile: (accountId: string) => instagramApi.getProfile(accountId),
    refreshToken: (accountId: string) => instagramApi.refreshToken(accountId),
};
