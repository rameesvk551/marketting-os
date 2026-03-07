// controllers/ContentPublishController.ts
// Handles Instagram content publishing endpoints.

import { Request, Response, NextFunction } from 'express';
import { IContentPublishService } from '../services/ContentPublishService.js';
import { logger } from '../../../config/logger.js';

export function createContentPublishController(publishService: IContentPublishService) {
    return {
        /**
         * POST /instagram/publish — Publish a single image post
         */
        publishImage: async (req: Request, res: Response, next: NextFunction) => {
            try {
                const tenantId = (req as any).context?.tenantId;
                if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant required' });
                const { accountId, imageUrl, caption, altText } = req.body;

                if (!accountId || !imageUrl) {
                    return res.status(400).json({
                        status: 'error',
                        message: 'accountId and imageUrl are required',
                    });
                }

                const media = await publishService.publishImage({
                    tenantId,
                    accountId,
                    imageUrl,
                    caption,
                    altText,
                });

                res.json({ status: 'success', data: media });
            } catch (error) {
                next(error);
            }
        },

        /**
         * POST /instagram/publish/carousel — Publish a carousel post
         */
        publishCarousel: async (req: Request, res: Response, next: NextFunction) => {
            try {
                const tenantId = (req as any).context?.tenantId;
                if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant required' });
                const { accountId, items, caption } = req.body;

                if (!accountId || !items || items.length < 2) {
                    return res.status(400).json({
                        status: 'error',
                        message: 'accountId and at least 2 items are required',
                    });
                }

                const media = await publishService.publishCarousel({
                    tenantId,
                    accountId,
                    items,
                    caption,
                });

                res.json({ status: 'success', data: media });
            } catch (error) {
                next(error);
            }
        },

        /**
         * GET /instagram/media — List published media
         */
        getMedia: async (req: Request, res: Response, next: NextFunction) => {
            try {
                const tenantId = (req as any).context?.tenantId;
                if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant required' });
                const { status, mediaType, limit, offset } = req.query;

                const result = await publishService.getMedia(tenantId, {
                    status: status as string,
                    mediaType: mediaType as string,
                    limit: limit ? parseInt(limit as string, 10) : undefined,
                    offset: offset ? parseInt(offset as string, 10) : undefined,
                });

                res.json({ status: 'success', data: result });
            } catch (error) {
                next(error);
            }
        },

        /**
         * GET /instagram/media/:id — Get single media item
         */
        getMediaById: async (req: Request, res: Response, next: NextFunction) => {
            try {
                const tenantId = (req as any).context?.tenantId;
                if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant required' });
                const media = await publishService.getMediaById(req.params.id, tenantId);

                if (!media) {
                    return res.status(404).json({ status: 'error', message: 'Media not found' });
                }

                res.json({ status: 'success', data: media });
            } catch (error) {
                next(error);
            }
        },

        /**
         * GET /instagram/publishing-limit/:accountId — Check publishing rate limit
         */
        getPublishingLimit: async (req: Request, res: Response, next: NextFunction) => {
            try {
                const tenantId = (req as any).context?.tenantId;
                if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant required' });
                const { accountId } = req.params;

                const limit = await publishService.getPublishingLimit(accountId, tenantId);
                res.json({ status: 'success', data: limit });
            } catch (error: any) {
                logger.error(`[IG Publish] getPublishingLimit error: ${error.message}`);
                res.status(500).json({ status: 'error', message: error.message });
            }
        },

        getOEmbed: async (req: Request, res: Response, next: NextFunction) => {
            try {
                const tenantId = (req as any).context?.tenantId;
                if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant required' });
                const { accountId } = req.params;
                const { url } = req.query;

                if (!url || typeof url !== 'string') {
                    return res.status(400).json({ status: 'error', message: 'URL is required' });
                }

                const data = await publishService.getOEmbed(accountId, tenantId, url);
                res.json({ status: 'success', data });
            } catch (error: any) {
                logger.error(`[IG Publish] getOEmbed error: ${error.message}`);
                res.status(500).json({ status: 'error', message: error.message });
            }
        },

        /**
         * POST /instagram/media/sync/:accountId — Sync media from Instagram
         */
        syncMedia: async (req: Request, res: Response, next: NextFunction) => {
            try {
                const tenantId = (req as any).context?.tenantId;
                if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant required' });
                const synced = await publishService.syncMediaFromInstagram(req.params.accountId, tenantId);

                res.json({ status: 'success', data: { synced } });
            } catch (error: any) {
                logger.error(`[IG Publish] syncMedia error: ${error.message}`);
                res.status(500).json({ status: 'error', message: error.message });
            }
        },
    };
}
