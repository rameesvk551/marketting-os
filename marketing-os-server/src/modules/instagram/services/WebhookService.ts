// services/WebhookService.ts
// Processes incoming Instagram webhook events (comments, messages, mentions).

import { logger } from '../../../config/logger.js';

export interface InstagramWebhookEntry {
    id: string;
    time: number;
    messaging?: Array<{
        sender: { id: string };
        recipient: { id: string };
        timestamp: number;
        message?: {
            mid: string;
            text?: string;
            attachments?: Array<{ type: string; payload: { url: string } }>;
        };
        postback?: {
            mid: string;
            title: string;
            payload: string;
        };
        read?: { watermark: number };
        reaction?: { mid: string; action: string; reaction: string; emoji: string };
    }>;
    changes?: Array<{
        field: string;
        value: {
            from: { id: string; username: string };
            media: { id: string; media_product_type: string };
            id: string;
            text: string;
            verb: string;
            created_time: number;
            parent_id?: string;
        };
    }>;
}

export interface IWebhookService {
    processWebhook(body: any): Promise<void>;
    verifySignature(payload: Buffer, signature: string, appSecret: string): boolean;
}

export function createWebhookService(): IWebhookService {
    return {
        async processWebhook(body: any): Promise<void> {
            const object = body.object;

            if (object !== 'instagram') {
                logger.warn(`[IG Webhook] Unexpected object type: ${object}`);
                return;
            }

            const entries: InstagramWebhookEntry[] = body.entry || [];

            for (const entry of entries) {
                const igAccountId = entry.id;

                // ── Handle comment/mention webhooks ──
                if (entry.changes) {
                    for (const change of entry.changes) {
                        switch (change.field) {
                            case 'comments':
                                logger.info(`[IG Webhook] Comment on media ${change.value.media?.id} from @${change.value.from?.username}: "${change.value.text}"`);
                                // TODO: Phase 3 — save to DB, trigger automation
                                break;

                            case 'mentions':
                                logger.info(`[IG Webhook] Mentioned by @${change.value.from?.username} in media ${change.value.media?.id}`);
                                // TODO: Phase 4 — UGC detection
                                break;

                            case 'live_comments':
                                logger.info(`[IG Webhook] Live comment from @${change.value.from?.username}`);
                                break;

                            case 'story_insights':
                                logger.info(`[IG Webhook] Story insights received for account ${igAccountId}`);
                                break;

                            default:
                                logger.debug(`[IG Webhook] Unhandled change field: ${change.field}`);
                        }
                    }
                }

                // ── Handle messaging webhooks ──
                if (entry.messaging) {
                    for (const event of entry.messaging) {
                        if (event.message) {
                            logger.info(`[IG Webhook] DM from ${event.sender.id}: "${event.message.text || '[media]'}"`);
                            // TODO: Phase 3 — unified inbox
                        } else if (event.postback) {
                            logger.info(`[IG Webhook] Postback from ${event.sender.id}: ${event.postback.payload}`);
                        } else if (event.read) {
                            logger.debug(`[IG Webhook] Message read by ${event.sender.id}`);
                        } else if (event.reaction) {
                            logger.debug(`[IG Webhook] Reaction ${event.reaction.emoji} on message ${event.reaction.mid}`);
                        }
                    }
                }
            }
        },

        verifySignature(payload: Buffer, signature: string, appSecret: string): boolean {
            try {
                const crypto = require('crypto');
                const expectedSig = crypto
                    .createHmac('sha256', appSecret)
                    .update(payload)
                    .digest('hex');
                return `sha256=${expectedSig}` === signature;
            } catch {
                return false;
            }
        },
    };
}
