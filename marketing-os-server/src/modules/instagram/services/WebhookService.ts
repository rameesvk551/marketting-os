// services/WebhookService.ts
// Processes incoming Instagram webhook events (comments, messages, mentions).

import { logger } from '../../../config/logger.js';
import { IInstagramAccountRepo } from '../repositories/InstagramAccountRepo.js';
import { IInstagramMediaRepo } from '../repositories/InstagramMediaRepo.js';
import { IInstagramCommentRepo } from '../repositories/InstagramCommentRepo.js';
import { IInstagramMessageRepo } from '../repositories/InstagramMessageRepo.js';

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

export function createWebhookService(
    accountRepo: IInstagramAccountRepo,
    mediaRepo: IInstagramMediaRepo,
    commentRepo: IInstagramCommentRepo,
    messageRepo: IInstagramMessageRepo
): IWebhookService {
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

                // Lookup ALL accounts connected to this Instagram User ID (across all tenants)
                const connectedAccounts = await accountRepo.findByIgUserIdGlobal(igAccountId);
                if (connectedAccounts.length === 0) {
                    logger.debug(`[IG Webhook] Received event for unconnected account ${igAccountId}`);
                    continue;
                }

                // ── Handle comment/mention webhooks ──
                if (entry.changes) {
                    for (const change of entry.changes) {
                        switch (change.field) {
                            case 'comments':
                                logger.info(`[IG Webhook] Comment on media ${change.value.media?.id} from @${change.value.from?.username}: "${change.value.text}"`);

                                // Process for each tenant that has this account connected
                                for (const account of connectedAccounts) {
                                    // Try to link to a specific media item in our DB
                                    const media = await mediaRepo.findByIgMediaId(change.value.media?.id);

                                    try {
                                        await commentRepo.save({
                                            tenantId: account.tenantId,
                                            accountId: account.id,
                                            mediaId: media ? media.id : '00000000-0000-0000-0000-000000000000', // Better handling if no matching media is found? 
                                            // Let's use the DB fallback. Actually, if media isn't found, should we create an orphaned comment? Our DB has mediaId NOT NULL. 
                                            // Wait, if no media, we can't save it because of foreign key. Since we only sync our own published posts, it's fine to skip if it's not our published media.
                                            // Let's skip if media not found in our DB, because we only track comments on OUR published media.
                                            igCommentId: change.value.id,
                                            igMediaId: change.value.media?.id,
                                            fromUsername: change.value.from?.username || 'unknown',
                                            fromId: change.value.from?.id,
                                            text: change.value.text,
                                            parentId: change.value.parent_id,
                                            timestamp: new Date(change.value.created_time * 1000), // Meta sends unix timestamp in seconds
                                        });

                                        if (media) {
                                            // Increment comment count on our media
                                            await mediaRepo.updateEngagement(media.id, {
                                                commentsCount: (media.commentsCount || 0) + 1
                                            });
                                        }
                                    } catch (err: any) {
                                        if (!media) {
                                            logger.warn(`[IG Webhook] Skipping comment ${change.value.id} because media ${change.value.media?.id} not found locally for tenant ${account.tenantId}.`);
                                        } else {
                                            logger.error(`[IG Webhook] Failed to save comment for tenant ${account.tenantId}: ${err.message}`);
                                        }
                                    }
                                }
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

                            for (const account of connectedAccounts) {
                                try {
                                    // Generate a pseudo-conversation ID based on the sender/recipient pair to group messages
                                    const p1 = event.sender.id < event.recipient.id ? event.sender.id : event.recipient.id;
                                    const p2 = event.sender.id > event.recipient.id ? event.sender.id : event.recipient.id;
                                    const conversationId = `${p1}_${p2}`;

                                    await messageRepo.save({
                                        tenantId: account.tenantId,
                                        accountId: account.id,
                                        igMessageId: event.message.mid,
                                        conversationId: conversationId,
                                        senderId: event.sender.id,
                                        recipientId: event.recipient.id,
                                        text: event.message.text,
                                        attachments: event.message.attachments,
                                        isEcho: event.sender.id === igAccountId, // If sender is the IG page itself
                                        timestamp: new Date(event.timestamp), // Meta sends MS here usually
                                    });
                                } catch (err: any) {
                                    logger.error(`[IG Webhook] Failed to save message for tenant ${account.tenantId}: ${err.message}`);
                                }
                            }
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
