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
    connect: async (payload: { accessToken?: string; code?: string; redirectUri?: string }) => {
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
    publishImage: async (payload: { accountId: string; imageUrl: string; caption?: string; altText?: string }) => {
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
};
