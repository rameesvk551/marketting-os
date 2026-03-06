// features/catalog/api/catalogApi.ts
// All Catalog REST API calls — self-contained in the catalog module.

import client from '../../../api/client';

export const catalogApi = {
    // ── Connection Management ──
    getConfig: async () => {
        const { data } = await client.get('/catalog/config');
        return data;
    },
    connect: async (payload: { catalogId: string; businessId: string; catalogName?: string; accessToken: string }) => {
        const { data } = await client.post('/catalog/connect', payload);
        return data;
    },
    disconnect: async (configId: string) => {
        const { data } = await client.delete(`/catalog/disconnect/${configId}`);
        return data;
    },

    // ── Browse Available Catalogs ──
    listCatalogs: async (businessId: string, accessToken: string) => {
        const { data } = await client.get('/catalog/catalogs', {
            params: { businessId, accessToken },
        });
        return data;
    },

    // ── Sync Operations ──
    syncAll: async () => {
        const { data } = await client.post('/catalog/sync');
        return data;
    },
    syncProduct: async (productId: string) => {
        const { data } = await client.post(`/catalog/sync/${productId}`);
        return data;
    },

    // ── Sync Logs ──
    getSyncLogs: async (limit?: number) => {
        const { data } = await client.get('/catalog/sync-logs', { params: { limit } });
        return data;
    },

    // ── Catalog Products ──
    getProducts: async () => {
        const { data } = await client.get('/catalog/products');
        return data;
    },
};
