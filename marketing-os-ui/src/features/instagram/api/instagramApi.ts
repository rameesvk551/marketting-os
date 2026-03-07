// features/instagram/api/instagramApi.ts
// All Instagram REST API calls — self-contained in the instagram module.

import client from '../../../api/client';

export const instagramApi = {
    // ── Config (for Facebook SDK initialization) ──
    getConfig: async () => {
        const { data } = await client.get('/instagram/config');
        return data;
    },

    // ── Account Connection ──
    getConnection: async () => {
        const { data } = await client.get('/instagram/connection');
        return data;
    },
    connect: async (payload: { accessToken?: string; igUserId?: string; code?: string; redirectUri?: string }) => {
        const { data } = await client.post('/instagram/connect', payload);
        return data;
    },
    disconnect: async (accountId: string) => {
        const { data } = await client.delete(`/instagram/disconnect/${accountId}`);
        return data;
    },
    getProfile: async (accountId: string) => {
        const { data } = await client.get(`/instagram/profile/${accountId}`);
        return data;
    },
    refreshToken: async (accountId: string) => {
        const { data } = await client.post(`/instagram/refresh-token/${accountId}`);
        return data;
    },

    // ── Content Publishing ──
    publishImage: async (payload: { accountId: string; imageUrl: string; caption?: string; altText?: string; mediaType?: 'IMAGE' | 'STORIES' }) => {
        const { data } = await client.post('/instagram/publish', payload);
        return data;
    },
    publishCarousel: async (payload: { accountId: string; items: Array<{ imageUrl?: string; videoUrl?: string; altText?: string }>; caption?: string }) => {
        const { data } = await client.post('/instagram/publish/carousel', payload);
        return data;
    },

    // ── Media Library ──
    getMedia: async (filters?: { status?: string; mediaType?: string; limit?: number; offset?: number }) => {
        const { data } = await client.get('/instagram/media', { params: filters });
        return data;
    },
    getMediaById: async (id: string) => {
        const { data } = await client.get(`/instagram/media/${id}`);
        return data;
    },
    getPublishingLimit: async (accountId: string) => {
        const { data } = await client.get(`/instagram/publishing-limit/${accountId}`);
        return data;
    },
    syncMedia: async (accountId: string) => {
        const { data } = await client.post(`/instagram/media/sync/${accountId}`);
        return data;
    },

    // ── Inbox (Comments & Messages) ──
    getComments: async (accountId?: string) => {
        const { data } = await client.get('/instagram/inbox/comments', { params: { accountId } });
        return data;
    },
    replyToComment: async (accountId: string, commentId: string, text: string) => {
        const { data } = await client.post(`/instagram/inbox/comments/${accountId}/${commentId}/reply`, { text });
        return data;
    },
    privateReplyToComment: async (accountId: string, commentId: string, text: string) => {
        const { data } = await client.post(`/instagram/inbox/comments/${accountId}/${commentId}/private-reply`, { text });
        return data;
    },
    deleteComment: async (accountId: string, commentId: string) => {
        const { data } = await client.delete(`/instagram/inbox/comments/${accountId}/${commentId}`);
        return data;
    },
    getMessages: async (accountId?: string) => {
        const { data } = await client.get('/instagram/inbox/messages', { params: { accountId } });
        return data;
    },
    sendMessage: async (accountId: string, recipientId: string, text: string) => {
        const { data } = await client.post(`/instagram/inbox/messages/${accountId}/send`, { recipientId, text });
        return data;
    },

    // ── Analytics ──
    getAccountInsights: async (accountId: string, period = 'day') => {
        const { data } = await client.get(`/instagram/analytics/${accountId}`, { params: { period } });
        return data;
    },
    getMediaAnalytics: async (accountId: string, limit = 50) => {
        const { data } = await client.get(`/instagram/analytics/${accountId}/media`, { params: { limit } });
        return data;
    },
};
