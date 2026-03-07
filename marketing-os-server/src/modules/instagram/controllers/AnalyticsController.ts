// controllers/AnalyticsController.ts
// Exposes endpoints for Instagram Analytics.

import { Request, Response } from 'express';
import { IAnalyticsService } from '../services/AnalyticsService.js';
import { logger } from '../../../config/logger.js';

export function createAnalyticsController(analyticsService: IAnalyticsService) {
    return {
        getAccountInsights: async (req: Request, res: Response) => {
            try {
                const tenantId = (req as any).tenantId;
                const { accountId } = req.params;
                const { period } = req.query; // 'day', 'week', '28_days', 'lifetime'

                const data = await analyticsService.getAccountInsights(tenantId, accountId, period as string);
                res.json({ status: 'success', data });
            } catch (error: any) {
                logger.error(`[IG Analytics] getAccountInsights error: ${error.message}`);
                res.status(500).json({ status: 'error', message: error.message });
            }
        },

        getMediaAnalytics: async (req: Request, res: Response) => {
            try {
                const tenantId = (req as any).tenantId;
                const { accountId } = req.params;
                const { limit } = req.query;

                const data = await analyticsService.getMediaAnalytics(tenantId, accountId, limit ? parseInt(limit as string) : undefined);
                res.json({ status: 'success', data });
            } catch (error: any) {
                logger.error(`[IG Analytics] getMediaAnalytics error: ${error.message}`);
                res.status(500).json({ status: 'error', message: error.message });
            }
        }
    };
}
