// features/instagram/services/contentService.ts
// Domain service for Instagram content publishing operations.

import { instagramApi } from '../api/instagramApi';

export const contentService = {
    publishImage: (payload: { accountId: string; imageUrl: string; caption?: string; altText?: string; mediaType?: 'IMAGE' | 'STORIES' }) =>
        instagramApi.publishImage(payload),

    publishCarousel: (payload: { accountId: string; items: Array<{ imageUrl?: string; videoUrl?: string; altText?: string }>; caption?: string }) =>
        instagramApi.publishCarousel(payload),

    getMedia: (filters?: { status?: string; mediaType?: string; limit?: number; offset?: number }) =>
        instagramApi.getMedia(filters),

    getMediaById: (id: string) => instagramApi.getMediaById(id),

    getPublishingLimit: (accountId: string) => instagramApi.getPublishingLimit(accountId),

    syncMedia: (accountId: string) => instagramApi.syncMedia(accountId),
};
