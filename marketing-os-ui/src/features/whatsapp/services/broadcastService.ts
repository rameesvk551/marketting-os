// services/broadcastService.ts
// API calls for WhatsApp broadcast campaigns.

import client from '../../../api/client';

export interface BroadcastPayload {
    templateName: string;
    language: string;
    recipients: Array<{ phone: string; variables?: any }>;
    scheduledAt?: string;
}

export const broadcastService = {
    broadcast: async (payload: BroadcastPayload) => {
        const { data } = await client.post('/whatsapp/broadcast', payload);
        return data;
    },
    getBroadcasts: async (params?: { status?: string; limit?: number; offset?: number }) => {
        const { data } = await client.get('/whatsapp/broadcast', { params });
        return data;
    },
    getBroadcast: async (id: string) => {
        const { data } = await client.get(`/whatsapp/broadcast/${id}`);
        return data;
    },
    getSegments: async (tenantId: string, tags: string[]) => {
        const params = new URLSearchParams();
        if (tags.length > 0) params.append('tags', tags.join(','));
        const { data } = await client.get(`/whatsapp/contacts/segments?${params.toString()}`, {
            headers: { 'x-tenant-id': tenantId }
        });
        return data.data; // Response is wrapped in { data: [] }
    }
};
