// services/ContentPublishService.ts
// Implements the Instagram container-based publish flow.

import { logger } from '../../../config/logger.js';
import { IInstagramGraphApiProvider } from '../providers/InstagramGraphApiProvider.js';
import { IInstagramMediaRepo } from '../repositories/InstagramMediaRepo.js';
import { IInstagramAccountRepo } from '../repositories/InstagramAccountRepo.js';
import { InstagramMedia, MediaType } from '../models/InstagramMedia.js';

export interface PublishImageInput {
    tenantId: string;
    accountId: string;
    imageUrl: string;
    caption?: string;
    altText?: string;
    mediaType?: MediaType | 'STORIES'; // Support STORIES explicitly
}

export interface PublishCarouselInput {
    tenantId: string;
    accountId: string;
    items: Array<{ imageUrl?: string; videoUrl?: string; altText?: string }>;
    caption?: string;
}

export interface IContentPublishService {
    publishImage(input: PublishImageInput): Promise<InstagramMedia>;
    publishCarousel(input: PublishCarouselInput): Promise<InstagramMedia>;
    getPublishingLimit(accountId: string, tenantId: string): Promise<{ used: number; total: number; remaining: number }>;
    getMedia(tenantId: string, filters?: { status?: string; mediaType?: string; limit?: number; offset?: number }): Promise<{ items: InstagramMedia[]; total: number }>;
    getMediaById(id: string, tenantId: string): Promise<InstagramMedia | null>;
    getOEmbed(accountId: string, tenantId: string, url: string): Promise<any>;
    syncMediaFromInstagram(accountId: string, tenantId: string): Promise<number>;
}

export function createContentPublishService(
    mediaRepo: IInstagramMediaRepo,
    accountRepo: IInstagramAccountRepo,
    createProvider: (accessToken: string, igUserId: string) => IInstagramGraphApiProvider,
): IContentPublishService {
    async function getProviderForAccount(accountId: string, tenantId: string) {
        const account = await accountRepo.findById(accountId, tenantId);
        if (!account) throw new Error('Instagram account not found');
        if (account.status !== 'active') throw new Error(`Instagram account is ${account.status}`);
        return { provider: createProvider(account.accessToken, account.igUserId), account };
    }

    /**
     * Poll for container readiness (video processing can take seconds)
     */
    async function waitForContainer(provider: IInstagramGraphApiProvider, containerId: string, maxAttempts = 30): Promise<void> {
        for (let i = 0; i < maxAttempts; i++) {
            const status = await provider.getContainerStatus(containerId);
            if (status.status_code === 'FINISHED') return;
            if (status.status_code === 'ERROR' || status.status_code === 'EXPIRED') {
                throw new Error(`Container ${containerId} failed: ${status.status_code} — ${status.status || 'Unknown error'}`);
            }
            // Wait 2 seconds between checks
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        throw new Error(`Container ${containerId} timed out after ${maxAttempts * 2}s`);
    }

    return {
        /**
         * Publish a single image post
         */
        async publishImage(input: PublishImageInput): Promise<InstagramMedia> {
            const { provider } = await getProviderForAccount(input.accountId, input.tenantId);

            const resolvedMediaType = input.mediaType || 'IMAGE';

            // Save pending record
            const media = await mediaRepo.save({
                tenantId: input.tenantId,
                accountId: input.accountId,
                mediaType: resolvedMediaType as MediaType,
                caption: input.caption,
                altText: input.altText,
                mediaUrl: input.imageUrl,
            });

            try {
                // Step 1: Create container
                logger.info(`[Instagram Publish] Creating container for image/story: ${input.imageUrl}`);
                const containerId = await provider.createMediaContainer({
                    media_type: resolvedMediaType === 'STORIES' ? 'STORIES' : 'IMAGE',
                    image_url: input.imageUrl,
                    caption: input.caption,
                    alt_text: input.altText,
                });

                await mediaRepo.updateStatus(media.id, 'processing', { containerId });

                // Step 2: Wait for container to finish
                await waitForContainer(provider, containerId);

                // Step 3: Publish
                const result = await provider.publishMedia(containerId);
                logger.info(`[Instagram Publish] Published successfully: ${result.id}`);

                await mediaRepo.updateStatus(media.id, 'published', {
                    igMediaId: result.id,
                    permalink: `https://www.instagram.com/p/${result.id}/`,
                });

                return (await mediaRepo.findById(media.id, input.tenantId))!;
            } catch (error: any) {
                logger.error(`[Instagram Publish] Failed: ${error.message}`);
                await mediaRepo.updateStatus(media.id, 'failed', { errorMessage: error.message });
                throw error;
            }
        },

        /**
         * Publish a carousel (multi-image) post
         */
        async publishCarousel(input: PublishCarouselInput): Promise<InstagramMedia> {
            if (input.items.length < 2 || input.items.length > 10) {
                throw new Error('Carousel must have 2-10 items');
            }

            const { provider } = await getProviderForAccount(input.accountId, input.tenantId);

            const media = await mediaRepo.save({
                tenantId: input.tenantId,
                accountId: input.accountId,
                mediaType: 'CAROUSEL' as MediaType,
                caption: input.caption,
                mediaUrl: input.items[0].imageUrl || input.items[0].videoUrl || '',
            });

            try {
                // Step 1: Create individual containers for each item
                const childContainerIds: string[] = [];
                for (const item of input.items) {
                    const params: Record<string, any> = { is_carousel_item: true };
                    if (item.imageUrl) params.image_url = item.imageUrl;
                    if (item.videoUrl) {
                        params.video_url = item.videoUrl;
                        params.media_type = 'VIDEO';
                    }
                    if (item.altText) params.alt_text = item.altText;

                    const childId = await provider.createMediaContainer(params);
                    childContainerIds.push(childId);
                }

                // Step 2: Wait for all child containers
                for (const childId of childContainerIds) {
                    await waitForContainer(provider, childId);
                }

                // Step 3: Create carousel container
                const carouselContainerId = await provider.createMediaContainer({
                    media_type: 'CAROUSEL',
                    caption: input.caption,
                    children: childContainerIds,
                });

                await mediaRepo.updateStatus(media.id, 'processing', { containerId: carouselContainerId });

                // Step 4: Publish carousel
                const result = await provider.publishMedia(carouselContainerId);
                logger.info(`[Instagram Publish] Carousel published: ${result.id}`);

                await mediaRepo.updateStatus(media.id, 'published', {
                    igMediaId: result.id,
                    permalink: `https://www.instagram.com/p/${result.id}/`,
                });

                return (await mediaRepo.findById(media.id, input.tenantId))!;
            } catch (error: any) {
                logger.error(`[Instagram Publish] Carousel failed: ${error.message}`);
                await mediaRepo.updateStatus(media.id, 'failed', { errorMessage: error.message });
                throw error;
            }
        },

        /**
         * Check publishing rate limit
         */
        async getPublishingLimit(accountId: string, tenantId: string) {
            const { provider } = await getProviderForAccount(accountId, tenantId);
            const limit = await provider.getPublishingLimit();
            return {
                used: limit.quota_usage,
                total: limit.config?.quota_total || 50,
                remaining: (limit.config?.quota_total || 50) - limit.quota_usage,
            };
        },

        /**
         * Get media list from local DB
         */
        async getMedia(tenantId, filters) {
            return mediaRepo.findByTenant(tenantId, filters);
        },

        /**
         * Get a single media item
         */
        async getMediaById(id, tenantId) {
            return mediaRepo.findById(id, tenantId);
        },

        /**
         * Get oEmbed data
         */
        async getOEmbed(accountId: string, tenantId: string, url: string): Promise<any> {
            const { provider } = await getProviderForAccount(accountId, tenantId);
            return provider.getOEmbed(url);
        },

        /**
         * Sync media from Instagram API to local DB
         */
        async syncMediaFromInstagram(accountId: string, tenantId: string): Promise<number> {
            const { provider, account } = await getProviderForAccount(accountId, tenantId);
            const igMedia = await provider.getMedia(50);
            let synced = 0;

            for (const item of igMedia.data || []) {
                const existing = await mediaRepo.findByIgMediaId(item.id);
                if (!existing) {
                    await mediaRepo.save({
                        tenantId,
                        accountId,
                        mediaType: item.media_type as MediaType || 'IMAGE',
                        caption: item.caption,
                        mediaUrl: item.media_url,
                    });
                    synced++;
                } else {
                    // Update engagement metrics
                    await mediaRepo.updateEngagement(existing.id, {
                        likeCount: item.like_count || 0,
                        commentsCount: item.comments_count || 0,
                    });
                }
            }

            logger.info(`[Instagram Sync] Synced ${synced} new media for account ${account.username}`);
            return synced;
        },
    };
}
