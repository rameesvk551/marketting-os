// container.ts
// Dependency injection container for Instagram module.
// Same architecture as WhatsApp container — all dependencies wired here.

import { Pool } from 'pg';
import { getConfig } from '../../config/index.js';

// Repositories
import { createInstagramAccountRepo, type IInstagramAccountRepo } from './repositories/InstagramAccountRepo.js';
import { createInstagramMediaRepo, type IInstagramMediaRepo } from './repositories/InstagramMediaRepo.js';
import { createInstagramCommentRepo, type IInstagramCommentRepo } from './repositories/InstagramCommentRepo.js';
import { createInstagramMessageRepo, type IInstagramMessageRepo } from './repositories/InstagramMessageRepo.js';

// Provider
import { createInstagramGraphApiProvider, type IInstagramGraphApiProvider } from './providers/InstagramGraphApiProvider.js';

// Services
import { createInstagramAuthService, type IInstagramAuthService } from './services/InstagramAuthService.js';
import { createContentPublishService, type IContentPublishService } from './services/ContentPublishService.js';
import { createWebhookService, type IWebhookService } from './services/WebhookService.js';
import { createInboxService, type IInboxService } from './services/InboxService.js';
import { createAnalyticsService, type IAnalyticsService } from './services/AnalyticsService.js';
import { createInstagramAutomationEngine, type IInstagramAutomationEngine } from './services/InstagramAutomationEngine.js';

// Controllers
import { createAccountController } from './controllers/AccountController.js';
import { createContentPublishController } from './controllers/ContentPublishController.js';
import { createInstagramWebhookController } from './controllers/WebhookController.js';
import { createInboxController } from './controllers/InboxController.js';
import { createAnalyticsController } from './controllers/AnalyticsController.js';
import { createAutomationController } from './controllers/AutomationController.js';

/**
 * Instagram container - holds all Instagram-related dependencies
 */
export interface InstagramContainer {
    // Repositories
    accountRepo: IInstagramAccountRepo;
    mediaRepo: IInstagramMediaRepo;
    commentRepo: IInstagramCommentRepo;
    messageRepo: IInstagramMessageRepo;

    // Services
    authService: IInstagramAuthService;
    publishService: IContentPublishService;
    webhookService: IWebhookService;
    inboxService: IInboxService;
    analyticsService: IAnalyticsService;
    automationEngine: IInstagramAutomationEngine;

    // Controllers
    accountController: ReturnType<typeof createAccountController>;
    contentPublishController: ReturnType<typeof createContentPublishController>;
    webhookController: ReturnType<typeof createInstagramWebhookController>;
    inboxController: ReturnType<typeof createInboxController>;
    analyticsController: ReturnType<typeof createAnalyticsController>;
    automationController: ReturnType<typeof createAutomationController>;

    // Provider factory
    createProvider: (accessToken: string, igUserId: string) => IInstagramGraphApiProvider;
}

/**
 * Create Instagram container with all dependencies
 */
export function createInstagramContainer(pool: Pool): InstagramContainer {
    const config = getConfig();
    const igConfig = config.instagram;

    const apiVersion = (igConfig as any).apiVersion || 'v21.0';
    const appId = (igConfig as any).appId || config.whatsapp?.meta?.appId || '';
    const appSecret = (igConfig as any).appSecret || config.whatsapp?.meta?.appSecret || '';
    const verifyToken = (igConfig as any).verifyToken || config.whatsapp?.verifyToken || '';

    // ── Repositories ──
    const accountRepo = createInstagramAccountRepo(pool);
    const mediaRepo = createInstagramMediaRepo(pool);
    const commentRepo = createInstagramCommentRepo(pool);
    const messageRepo = createInstagramMessageRepo(pool);

    // ── Provider factory (per-account, since each tenant has their own token) ──
    const createProvider = (accessToken: string, igUserId: string): IInstagramGraphApiProvider => {
        return createInstagramGraphApiProvider({
            accessToken,
            igUserId,
            apiVersion,
        });
    };

    // ── Services ──
    const authService = createInstagramAuthService(appId, appSecret, apiVersion);
    const publishService = createContentPublishService(mediaRepo, accountRepo, createProvider);
    const webhookService = createWebhookService(accountRepo, mediaRepo, commentRepo, messageRepo);
    const inboxService = createInboxService(commentRepo, messageRepo, accountRepo, createProvider);
    const analyticsService = createAnalyticsService(accountRepo, mediaRepo, createProvider);
    const automationEngine = createInstagramAutomationEngine(pool, inboxService, accountRepo);

    // Late-bind automation engine to webhook service (avoid circular dependency)
    webhookService.setAutomationEngine(automationEngine);

    // ── Controllers ──
    const accountController = createAccountController(authService, accountRepo);
    const contentPublishController = createContentPublishController(publishService);
    const webhookController = createInstagramWebhookController(webhookService, verifyToken);
    const inboxController = createInboxController(inboxService);
    const analyticsController = createAnalyticsController(analyticsService);
    const automationController = createAutomationController(automationEngine);

    return {
        accountRepo,
        mediaRepo,
        commentRepo,
        messageRepo,
        authService,
        publishService,
        webhookService,
        inboxService,
        analyticsService,
        automationEngine,
        accountController,
        contentPublishController,
        webhookController,
        inboxController,
        analyticsController,
        automationController,
        createProvider,
    };
}
