// instagram.routes.ts
// Route definitions for the Instagram module with dependency injection.

import { Router, Request, Response, NextFunction } from 'express';
import { createAccountController } from './controllers/AccountController.js';
import { createContentPublishController } from './controllers/ContentPublishController.js';
import { createInstagramWebhookController } from './controllers/WebhookController.js';
import { createInboxController } from './controllers/InboxController.js';
import { createAnalyticsController } from './controllers/AnalyticsController.js';
import { createAutomationController } from './controllers/AutomationController.js';

/** Rate limiter — pass-through stub (implement with Redis in production) */
const apiRateLimiter = (_req: Request, _res: Response, next: NextFunction) => next();

/**
 * Create Instagram routes with dependency injection
 */
export function createInstagramRoutes(dependencies: {
    accountController: ReturnType<typeof createAccountController>;
    contentPublishController: ReturnType<typeof createContentPublishController>;
    webhookController: ReturnType<typeof createInstagramWebhookController>;
    inboxController: ReturnType<typeof createInboxController>;
    analyticsController: ReturnType<typeof createAnalyticsController>;
    automationController?: ReturnType<typeof createAutomationController>;
    authMiddleware: (req: any, res: any, next: any) => void;
    tenantMiddleware: (req: any, res: any, next: any) => void;
}): Router {
    const router = Router();
    const {
        accountController,
        contentPublishController,
        webhookController,
        inboxController,
        analyticsController,
        automationController,
        authMiddleware,
        tenantMiddleware,
    } = dependencies;

    // ============================================
    // WEBHOOK ROUTES (No auth — called by Meta)
    // ============================================

    // Webhook verification (Meta challenge)
    router.get('/webhook', webhookController.verifyChallenge);
    router.get('/webhooks/instagram', webhookController.verifyChallenge);

    // Webhook handler (Meta events)
    router.post('/webhook', webhookController.handleWebhook);
    router.post('/webhooks/instagram', webhookController.handleWebhook);

    // ============================================
    // AUTHENTICATED ROUTES
    // ============================================

    router.use(authMiddleware);
    router.use(tenantMiddleware);
    router.use(apiRateLimiter);

    // ── Config (for frontend Facebook SDK initialization) ──
    router.get('/config', (req, res) => {
        const config = require('../../config/index.js').getConfig();
        const igConfig = config.instagram || {};
        const appId = igConfig.appId || config.whatsapp?.meta?.appId || '';
        res.json({
            status: 'success',
            data: {
                appId,
                configId: igConfig.configId || '',
                apiVersion: igConfig.apiVersion || 'v21.0',
            },
        });
    });

    // ── Account Connection ──
    router.get('/connection', accountController.getConnection);
    router.post('/connect', accountController.connect);
    router.delete('/disconnect/:accountId', accountController.disconnect);
    router.get('/profile/:accountId', accountController.getProfile);
    router.post('/refresh-token/:accountId', accountController.refreshToken);

    // ── Content Publishing ──
    router.post('/publish', contentPublishController.publishImage);
    router.post('/publish/carousel', contentPublishController.publishCarousel);

    // ── Media Library & Utilities ──
    router.get('/media', contentPublishController.getMedia);
    router.get('/media/:id', contentPublishController.getMediaById);
    router.get('/publishing-limit/:accountId', contentPublishController.getPublishingLimit);
    router.post('/media/sync/:accountId', contentPublishController.syncMedia);
    router.get('/oembed/:accountId', contentPublishController.getOEmbed);

    // ── Inbox (Comments & Messages) ──
    router.get('/inbox/comments', inboxController.getComments);
    router.post('/inbox/comments/:accountId/:commentId/reply', inboxController.replyToComment);
    router.post('/inbox/comments/:accountId/:commentId/private-reply', inboxController.privateReplyToComment);
    router.delete('/inbox/comments/:accountId/:commentId', inboxController.deleteComment);

    router.get('/inbox/messages', inboxController.getMessages);
    router.post('/inbox/messages/:accountId/send', inboxController.sendMessage);

    // ── Analytics ──
    router.get('/analytics/:accountId', analyticsController.getAccountInsights);
    router.get('/analytics/:accountId/media', analyticsController.getMediaAnalytics);

    // ── Automation Rules ──
    if (automationController) {
        router.get('/automation/rules', automationController.getRules);
        router.get('/automation/rules/:ruleId', automationController.getRuleById);
        router.post('/automation/rules', automationController.createRule);
        router.put('/automation/rules/:ruleId', automationController.updateRule);
        router.delete('/automation/rules/:ruleId', automationController.deleteRule);
        router.patch('/automation/rules/:ruleId/status', automationController.toggleRuleStatus);
    }

    // ── Health Check ──
    router.get('/health', async (_req, res) => {
        res.json({
            status: 'ok',
            module: 'instagram',
            timestamp: new Date().toISOString(),
        });
    });

    return router;
}

export default createInstagramRoutes;
