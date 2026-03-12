// services/InstagramAutomationEngine.ts
// Processes Instagram automation rules for comments, DMs, and conversation openers.

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../../config/logger.js';
import { IInboxService } from './InboxService.js';
import { IInstagramAccountRepo } from '../repositories/InstagramAccountRepo.js';

export interface InstagramAutomationTrigger {
    type: 'comment' | 'dm' | 'conversation_opener';
    scope: 'all' | 'specific' | 'any' | 'next';
    postId?: string;
    keywordFilterEnabled: boolean;
    keywords: string[];
}

export interface InstagramAutomationOptionalActions {
    replyPublic: boolean;
    sendOpeningDm: boolean;
    requireFollow: boolean;
    collectEmail: boolean;
}

export interface InstagramMessageBlock {
    id: string;
    type: 'text' | 'button' | 'product_card' | 'product_catalog' | 'image' | 'cta';
    text?: string;
    label?: string;
    url?: string;
    imageUrl?: string;
    productId?: string;
    ctaLabel?: string;
}

export interface InstagramAutomationAction {
    type: 'send_dm';
    message: string;
    blocks: InstagramMessageBlock[];
    products: Array<{ id: string; name: string; price: number; image: string; url?: string; description?: string }>;
}

export interface InstagramAutomationRule {
    id: string;
    tenantId: string;
    accountId?: string;
    name: string;
    status: 'draft' | 'active' | 'paused';
    trigger: InstagramAutomationTrigger;
    optionalActions: InstagramAutomationOptionalActions;
    actions: InstagramAutomationAction[];
    stats: {
        triggered: number;
        dmsSent: number;
        repliesSent: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

export interface InstagramCommentEvent {
    commentId: string;
    igCommentId: string;
    mediaId: string;
    igMediaId: string;
    fromUsername: string;
    fromId: string;
    text: string;
    accountId: string;
}

export interface InstagramMessageEvent {
    messageId: string;
    senderId: string;
    text: string;
    accountId: string;
    isFirstMessage?: boolean; // For conversation opener detection
}

export interface IInstagramAutomationEngine {
    processCommentEvent(tenantId: string, event: InstagramCommentEvent): Promise<boolean>;
    processMessageEvent(tenantId: string, event: InstagramMessageEvent): Promise<boolean>;
    processConversationOpener(tenantId: string, accountId: string, senderId: string): Promise<boolean>;
    getRules(tenantId: string): Promise<InstagramAutomationRule[]>;
    getRuleById(tenantId: string, ruleId: string): Promise<InstagramAutomationRule | null>;
    createRule(tenantId: string, ruleData: Partial<InstagramAutomationRule>): Promise<InstagramAutomationRule>;
    updateRule(tenantId: string, ruleId: string, ruleData: Partial<InstagramAutomationRule>): Promise<InstagramAutomationRule>;
    deleteRule(tenantId: string, ruleId: string): Promise<void>;
    toggleRuleStatus(tenantId: string, ruleId: string, status: 'active' | 'paused'): Promise<InstagramAutomationRule>;
}

export function createInstagramAutomationEngine(
    pool: Pool,
    inboxService: IInboxService,
    accountRepo: IInstagramAccountRepo
): IInstagramAutomationEngine {

    function mapRowToRule(row: any): InstagramAutomationRule {
        return {
            id: row.id,
            tenantId: row.tenant_id,
            accountId: row.account_id,
            name: row.name,
            status: row.status,
            trigger: row.trigger || {},
            optionalActions: row.optional_actions || {},
            actions: row.actions || [],
            stats: {
                triggered: row.stats?.triggered || 0,
                dmsSent: row.stats?.dms_sent || 0,
                repliesSent: row.stats?.replies_sent || 0,
            },
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }

    async function evaluateKeywords(rule: InstagramAutomationRule, text: string): Promise<boolean> {
        const trigger = rule.trigger;
        
        // If keyword filter is disabled, match all
        if (!trigger.keywordFilterEnabled) {
            return true;
        }

        const keywords = trigger.keywords || [];
        if (keywords.length === 0) {
            return true; // No keywords = match all
        }

        const lowerText = text.toLowerCase();
        return keywords.some(kw => lowerText.includes(kw.toLowerCase()));
    }

    async function executeActions(
        tenantId: string,
        rule: InstagramAutomationRule,
        event: InstagramCommentEvent | InstagramMessageEvent,
        eventType: 'comment' | 'dm'
    ): Promise<void> {
        const accountId = event.accountId;

        for (const action of rule.actions) {
            try {
                if (action.type === 'send_dm') {
                    // For comments, we need to use private reply
                    if (eventType === 'comment') {
                        const commentEvent = event as InstagramCommentEvent;

                        // Optional: Send public reply first
                        if (rule.optionalActions.replyPublic) {
                            const publicReply = `Thanks for your interest! Check your DMs 📩`;
                            try {
                                await inboxService.replyToComment(tenantId, accountId, commentEvent.igCommentId, publicReply);
                                logger.info(`[IG Automation] Sent public reply to comment ${commentEvent.igCommentId}`);
                            } catch (err: any) {
                                logger.warn(`[IG Automation] Failed to send public reply: ${err.message}`);
                            }
                        }

                        // Send opening DM if enabled
                        if (rule.optionalActions.sendOpeningDm) {
                            const openingMessage = "Hey! Thanks for your interest 🙌";
                            try {
                                await inboxService.privateReplyToComment(tenantId, accountId, commentEvent.igCommentId, openingMessage);
                                logger.info(`[IG Automation] Sent opening DM for comment ${commentEvent.igCommentId}`);
                            } catch (err: any) {
                                logger.warn(`[IG Automation] Failed to send opening DM: ${err.message}`);
                            }
                        }

                        // Send main message via private reply
                        const mainMessage = action.message || "Here's what you requested!";
                        await inboxService.privateReplyToComment(tenantId, accountId, commentEvent.igCommentId, mainMessage);
                        logger.info(`[IG Automation] Sent DM to commenter ${commentEvent.fromUsername}`);

                        // Send additional text blocks
                        for (const block of action.blocks) {
                            if (block.type === 'text' && block.text) {
                                try {
                                    await inboxService.privateReplyToComment(tenantId, accountId, commentEvent.igCommentId, block.text);
                                } catch (err: any) {
                                    logger.warn(`[IG Automation] Failed to send text block: ${err.message}`);
                                }
                            } else if (block.type === 'button' && block.url) {
                                const buttonMsg = `${block.label || 'Link'}: ${block.url}`;
                                try {
                                    await inboxService.privateReplyToComment(tenantId, accountId, commentEvent.igCommentId, buttonMsg);
                                } catch (err: any) {
                                    logger.warn(`[IG Automation] Failed to send button block: ${err.message}`);
                                }
                            } else if (block.type === 'cta' && block.url) {
                                const ctaMsg = `🛒 ${block.ctaLabel || 'Shop Now'}: ${block.url}`;
                                try {
                                    await inboxService.privateReplyToComment(tenantId, accountId, commentEvent.igCommentId, ctaMsg);
                                } catch (err: any) {
                                    logger.warn(`[IG Automation] Failed to send CTA block: ${err.message}`);
                                }
                            } else if (block.type === 'image' && block.imageUrl) {
                                // Send image as attachment
                                try {
                                    await inboxService.sendImage(tenantId, accountId, commentEvent.fromId, block.imageUrl);
                                } catch (err: any) {
                                    logger.warn(`[IG Automation] Failed to send image block: ${err.message}`);
                                }
                            } else if ((block.type === 'product_card' || block.type === 'product_catalog') && action.products?.length > 0) {
                                // Send product cards as rich template - use fromId to send DM
                                try {
                                    const productCards = action.products.map(p => ({
                                        name: p.name,
                                        price: p.price,
                                        image: p.image,
                                        url: p.url,
                                        currency: '₹'
                                    }));
                                    await inboxService.sendProductCards(
                                        tenantId,
                                        accountId,
                                        commentEvent.fromId,
                                        productCards,
                                        block.ctaLabel || 'Shop Now'
                                    );
                                    logger.info(`[IG Automation] Sent ${productCards.length} product cards to ${commentEvent.fromUsername}`);
                                } catch (err: any) {
                                    logger.warn(`[IG Automation] Failed to send product cards: ${err.message}`);
                                    // Fallback to plain text format
                                    const productList = action.products
                                        .map(p => `📦 ${p.name} - ₹${p.price}${p.url ? ` ${p.url}` : ''}`)
                                        .join('\n');
                                    const fallbackMsg = `Here's our catalog:\n\n${productList}`;
                                    await inboxService.privateReplyToComment(tenantId, accountId, commentEvent.igCommentId, fallbackMsg);
                                }
                            }
                        }

                        // Send product catalog if products exist and not already sent via blocks
                        const hasProductBlock = action.blocks?.some(b => b.type === 'product_card' || b.type === 'product_catalog');
                        if (!hasProductBlock && action.products && action.products.length > 0) {
                            // Send as rich product cards
                            try {
                                const productCards = action.products.map(p => ({
                                    name: p.name,
                                    price: p.price,
                                    image: p.image,
                                    url: p.url,
                                    currency: '₹'
                                }));
                                await inboxService.sendProductCards(
                                    tenantId,
                                    accountId,
                                    commentEvent.fromId,
                                    productCards,
                                    'Shop Now'
                                );
                                logger.info(`[IG Automation] Sent ${productCards.length} product cards to ${commentEvent.fromUsername}`);
                            } catch (err: any) {
                                logger.warn(`[IG Automation] Failed to send product cards, falling back to text: ${err.message}`);
                                // Fallback to plain text
                                const productList = action.products
                                    .map(p => `📦 ${p.name} - ₹${p.price}`)
                                    .join('\n');
                                const catalogMsg = `Here's our catalog:\n\n${productList}`;
                                try {
                                    await inboxService.privateReplyToComment(tenantId, accountId, commentEvent.igCommentId, catalogMsg);
                                } catch (err2: any) {
                                    logger.warn(`[IG Automation] Failed to send fallback catalog: ${err2.message}`);
                                }
                            }
                        }
                    } else {
                        // For DM events, reply directly
                        const messageEvent = event as InstagramMessageEvent;
                        
                        // Send main message
                        await inboxService.sendMessage(tenantId, accountId, messageEvent.senderId, action.message);
                        logger.info(`[IG Automation] Sent DM reply to ${messageEvent.senderId}`);

                        // Process blocks for DM events
                        for (const block of action.blocks || []) {
                            if (block.type === 'text' && block.text) {
                                try {
                                    await inboxService.sendMessage(tenantId, accountId, messageEvent.senderId, block.text);
                                } catch (err: any) {
                                    logger.warn(`[IG Automation] Failed to send text block in DM: ${err.message}`);
                                }
                            } else if (block.type === 'image' && block.imageUrl) {
                                try {
                                    await inboxService.sendImage(tenantId, accountId, messageEvent.senderId, block.imageUrl);
                                } catch (err: any) {
                                    logger.warn(`[IG Automation] Failed to send image in DM: ${err.message}`);
                                }
                            } else if ((block.type === 'product_card' || block.type === 'product_catalog') && action.products?.length > 0) {
                                try {
                                    const productCards = action.products.map(p => ({
                                        name: p.name,
                                        price: p.price,
                                        image: p.image,
                                        url: p.url,
                                        currency: '₹'
                                    }));
                                    await inboxService.sendProductCards(
                                        tenantId,
                                        accountId,
                                        messageEvent.senderId,
                                        productCards,
                                        block.ctaLabel || 'Shop Now'
                                    );
                                    logger.info(`[IG Automation] Sent ${productCards.length} product cards in DM`);
                                } catch (err: any) {
                                    logger.warn(`[IG Automation] Failed to send product cards in DM: ${err.message}`);
                                    // Fallback to text
                                    const productList = action.products
                                        .map(p => `📦 ${p.name} - ₹${p.price}${p.url ? ` ${p.url}` : ''}`)
                                        .join('\n');
                                    await inboxService.sendMessage(tenantId, accountId, messageEvent.senderId, `Here's our catalog:\n\n${productList}`);
                                }
                            }
                        }

                        // Send products if they exist and weren't sent via blocks
                        const hasProductBlock = action.blocks?.some(b => b.type === 'product_card' || b.type === 'product_catalog');
                        if (!hasProductBlock && action.products && action.products.length > 0) {
                            try {
                                const productCards = action.products.map(p => ({
                                    name: p.name,
                                    price: p.price,
                                    image: p.image,
                                    url: p.url,
                                    currency: '₹'
                                }));
                                await inboxService.sendProductCards(tenantId, accountId, messageEvent.senderId, productCards, 'Shop Now');
                                logger.info(`[IG Automation] Sent ${productCards.length} product cards in DM`);
                            } catch (err: any) {
                                logger.warn(`[IG Automation] Failed to send product cards in DM, using text: ${err.message}`);
                                const productList = action.products
                                    .map(p => `📦 ${p.name} - ₹${p.price}`)
                                    .join('\n');
                                await inboxService.sendMessage(tenantId, accountId, messageEvent.senderId, `Here's our catalog:\n\n${productList}`);
                            }
                        }
                    }

                    // Update stats
                    await pool.query(
                        `UPDATE instagram_automation_rules 
                         SET stats = jsonb_set(
                             jsonb_set(stats, '{triggered}', (COALESCE(stats->>'triggered', '0')::int + 1)::text::jsonb),
                             '{dms_sent}', (COALESCE(stats->>'dms_sent', '0')::int + 1)::text::jsonb
                         ),
                         updated_at = NOW()
                         WHERE id = $1 AND tenant_id = $2`,
                        [rule.id, tenantId]
                    );
                }
            } catch (error: any) {
                logger.error(`[IG Automation] Failed to execute action ${action.type} for rule ${rule.name}: ${error.message}`);
            }
        }
    }

    return {
        async processCommentEvent(tenantId: string, event: InstagramCommentEvent): Promise<boolean> {
            // Fetch active rules for this tenant
            const result = await pool.query(
                `SELECT * FROM instagram_automation_rules 
                 WHERE tenant_id = $1 
                 AND status = 'active'
                 AND trigger->>'type' = 'comment'`,
                [tenantId]
            );

            const rules = result.rows.map(mapRowToRule);
            let matched = false;

            for (const rule of rules) {
                // Check if rule applies to this specific post
                if (rule.trigger.scope === 'specific' && rule.trigger.postId) {
                    if (rule.trigger.postId !== event.igMediaId) {
                        continue; // Skip - doesn't match this post
                    }
                }

                // Check if account matches (if rule is account-specific)
                if (rule.accountId && rule.accountId !== event.accountId) {
                    continue;
                }

                // Evaluate keywords
                if (await evaluateKeywords(rule, event.text)) {
                    logger.info(`[IG Automation] Rule "${rule.name}" matched for comment from @${event.fromUsername}`);
                    await executeActions(tenantId, rule, event, 'comment');
                    matched = true;
                }
            }

            return matched;
        },

        async processMessageEvent(tenantId: string, event: InstagramMessageEvent): Promise<boolean> {
            // Fetch active rules for DM triggers
            const result = await pool.query(
                `SELECT * FROM instagram_automation_rules 
                 WHERE tenant_id = $1 
                 AND status = 'active'
                 AND trigger->>'type' = 'dm'`,
                [tenantId]
            );

            const rules = result.rows.map(mapRowToRule);
            let matched = false;

            for (const rule of rules) {
                // Check if account matches
                if (rule.accountId && rule.accountId !== event.accountId) {
                    continue;
                }

                // Evaluate keywords
                if (await evaluateKeywords(rule, event.text)) {
                    logger.info(`[IG Automation] Rule "${rule.name}" matched for DM from ${event.senderId}`);
                    await executeActions(tenantId, rule, event, 'dm');
                    matched = true;
                }
            }

            return matched;
        },

        /**
         * Process conversation opener - when someone opens your DM for the first time
         */
        async processConversationOpener(tenantId: string, accountId: string, senderId: string): Promise<boolean> {
            // Fetch active rules for conversation opener triggers
            const result = await pool.query(
                `SELECT * FROM instagram_automation_rules 
                 WHERE tenant_id = $1 
                 AND status = 'active'
                 AND trigger->>'type' = 'conversation_opener'`,
                [tenantId]
            );

            const rules = result.rows.map(mapRowToRule);
            let matched = false;

            for (const rule of rules) {
                // Check if account matches
                if (rule.accountId && rule.accountId !== accountId) {
                    continue;
                }

                logger.info(`[IG Automation] Conversation opener rule "${rule.name}" triggered for user ${senderId}`);
                
                // Create a synthetic message event to reuse executeActions
                const syntheticEvent: InstagramMessageEvent = {
                    messageId: `opener-${Date.now()}`,
                    senderId,
                    text: '',
                    accountId,
                    isFirstMessage: true
                };

                await executeActions(tenantId, rule, syntheticEvent, 'dm');
                matched = true;
            }

            return matched;
        },

        async getRules(tenantId: string): Promise<InstagramAutomationRule[]> {
            const result = await pool.query(
                `SELECT * FROM instagram_automation_rules 
                 WHERE tenant_id = $1 
                 ORDER BY created_at DESC`,
                [tenantId]
            );
            return result.rows.map(mapRowToRule);
        },

        async getRuleById(tenantId: string, ruleId: string): Promise<InstagramAutomationRule | null> {
            const result = await pool.query(
                `SELECT * FROM instagram_automation_rules 
                 WHERE id = $1 AND tenant_id = $2`,
                [ruleId, tenantId]
            );
            if (result.rows.length === 0) return null;
            return mapRowToRule(result.rows[0]);
        },

        async createRule(tenantId: string, ruleData: Partial<InstagramAutomationRule>): Promise<InstagramAutomationRule> {
            const id = uuidv4();
            const query = `
                INSERT INTO instagram_automation_rules (
                    id, tenant_id, account_id, name, status, trigger, optional_actions, actions, stats, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
                RETURNING *
            `;
            const result = await pool.query(query, [
                id,
                tenantId,
                ruleData.accountId || null,
                ruleData.name || 'Untitled Automation',
                ruleData.status || 'draft',
                JSON.stringify(ruleData.trigger || {}),
                JSON.stringify(ruleData.optionalActions || {}),
                JSON.stringify(ruleData.actions || []),
                JSON.stringify({ triggered: 0, dms_sent: 0, replies_sent: 0 }),
            ]);

            logger.info(`[IG Automation] Created rule "${ruleData.name}" for tenant ${tenantId}`);
            return mapRowToRule(result.rows[0]);
        },

        async updateRule(tenantId: string, ruleId: string, ruleData: Partial<InstagramAutomationRule>): Promise<InstagramAutomationRule> {
            const updates: string[] = [];
            const values: any[] = [];
            let paramIndex = 1;

            if (ruleData.name !== undefined) {
                updates.push(`name = $${paramIndex++}`);
                values.push(ruleData.name);
            }
            if (ruleData.status !== undefined) {
                updates.push(`status = $${paramIndex++}`);
                values.push(ruleData.status);
            }
            if (ruleData.accountId !== undefined) {
                updates.push(`account_id = $${paramIndex++}`);
                values.push(ruleData.accountId);
            }
            if (ruleData.trigger !== undefined) {
                updates.push(`trigger = $${paramIndex++}`);
                values.push(JSON.stringify(ruleData.trigger));
            }
            if (ruleData.optionalActions !== undefined) {
                updates.push(`optional_actions = $${paramIndex++}`);
                values.push(JSON.stringify(ruleData.optionalActions));
            }
            if (ruleData.actions !== undefined) {
                updates.push(`actions = $${paramIndex++}`);
                values.push(JSON.stringify(ruleData.actions));
            }

            updates.push(`updated_at = NOW()`);

            values.push(ruleId);
            values.push(tenantId);

            const query = `
                UPDATE instagram_automation_rules 
                SET ${updates.join(', ')}
                WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex}
                RETURNING *
            `;

            const result = await pool.query(query, values);
            if (result.rows.length === 0) {
                throw new Error('Rule not found');
            }

            logger.info(`[IG Automation] Updated rule ${ruleId} for tenant ${tenantId}`);
            return mapRowToRule(result.rows[0]);
        },

        async deleteRule(tenantId: string, ruleId: string): Promise<void> {
            const result = await pool.query(
                `DELETE FROM instagram_automation_rules 
                 WHERE id = $1 AND tenant_id = $2`,
                [ruleId, tenantId]
            );
            if (result.rowCount === 0) {
                throw new Error('Rule not found');
            }
            logger.info(`[IG Automation] Deleted rule ${ruleId} for tenant ${tenantId}`);
        },

        async toggleRuleStatus(tenantId: string, ruleId: string, status: 'active' | 'paused'): Promise<InstagramAutomationRule> {
            const result = await pool.query(
                `UPDATE instagram_automation_rules 
                 SET status = $1, updated_at = NOW()
                 WHERE id = $2 AND tenant_id = $3
                 RETURNING *`,
                [status, ruleId, tenantId]
            );
            if (result.rows.length === 0) {
                throw new Error('Rule not found');
            }
            logger.info(`[IG Automation] ${status === 'active' ? 'Activated' : 'Paused'} rule ${ruleId}`);
            return mapRowToRule(result.rows[0]);
        },
    };
}
