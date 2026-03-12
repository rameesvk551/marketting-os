// services/InboxService.ts
// Handles business logic for fetching and responding to Instagram comments and messages.

import { IInstagramCommentRepo } from '../repositories/InstagramCommentRepo.js';
import { IInstagramMessageRepo } from '../repositories/InstagramMessageRepo.js';
import { IInstagramAccountRepo } from '../repositories/InstagramAccountRepo.js';
import { IInstagramGraphApiProvider } from '../providers/InstagramGraphApiProvider.js';

export interface ProductCard {
    id?: string;
    name: string;
    price: number;
    currency?: string;
    image: string;
    url?: string;
    description?: string;
}

export interface IInboxService {
    getComments(tenantId: string, accountId?: string): Promise<any[]>;
    replyToComment(tenantId: string, accountId: string, commentId: string, text: string): Promise<void>;
    privateReplyToComment(tenantId: string, accountId: string, commentId: string, text: string): Promise<void>;
    deleteComment(tenantId: string, accountId: string, commentId: string): Promise<void>;
    getMessages(tenantId: string, accountId?: string): Promise<any[]>;
    sendMessage(tenantId: string, accountId: string, recipientId: string, text: string): Promise<void>;
    sendProductCards(tenantId: string, accountId: string, recipientId: string, products: ProductCard[], ctaLabel?: string): Promise<void>;
    sendImage(tenantId: string, accountId: string, recipientId: string, imageUrl: string): Promise<void>;
    sendButtonMessage(tenantId: string, accountId: string, recipientId: string, text: string, buttons: Array<{ label: string; url: string }>): Promise<void>;
}

export function createInboxService(
    commentRepo: IInstagramCommentRepo,
    messageRepo: IInstagramMessageRepo,
    accountRepo: IInstagramAccountRepo,
    createProvider: (accessToken: string, igUserId: string) => IInstagramGraphApiProvider
): IInboxService {

    async function getProviderForAccount(tenantId: string, accountId: string) {
        const account = await accountRepo.findById(accountId, tenantId);
        if (!account) throw new Error("Instagram account not found or not owned by tenant");
        if (!account.accessToken) throw new Error("Instagram account has no access token");
        return createProvider(account.accessToken, account.igUserId);
    }

    return {
        async getComments(tenantId: string, accountId?: string) {
            // If accountId is provided, might want to filter by it. 
            // Currently findByTenant returns all for tenant, could add account filter to repo later.
            // For now, filtering in memory if specified.
            const comments = await commentRepo.findByTenant(tenantId, 100);
            if (accountId) return comments.filter(c => c.accountId === accountId);
            return comments;
        },

        async replyToComment(tenantId: string, accountId: string, commentId: string, text: string) {
            const provider = await getProviderForAccount(tenantId, accountId);
            await provider.replyToComment(commentId, text);
            // Optionally save our own reply or webhook will catch it
        },

        async privateReplyToComment(tenantId: string, accountId: string, commentId: string, text: string) {
            const provider = await getProviderForAccount(tenantId, accountId);
            const res = await provider.sendPrivateReply(commentId, text);

            // It sends a DM, so logically we could save it as an outgoing message,
            // but for simplicity Meta's webhook will fire a message echo event.
        },

        async deleteComment(tenantId: string, accountId: string, commentId: string) {
            const provider = await getProviderForAccount(tenantId, accountId);
            await provider.deleteComment(commentId);
            await commentRepo.updateVisibility(commentId, tenantId, true); // Mark hidden/deleted locally
        },

        async getMessages(tenantId: string, accountId?: string) {
            const messages = await messageRepo.findByTenant(tenantId, 100);
            if (accountId) return messages.filter(m => m.accountId === accountId);
            return messages;
        },

        async sendMessage(tenantId: string, accountId: string, recipientId: string, text: string) {
            const provider = await getProviderForAccount(tenantId, accountId);
            const res = await provider.sendMessage(recipientId, text);

            // Save our sent message locally immediately
            await messageRepo.save({
                tenantId,
                accountId,
                igMessageId: res.message_id,
                senderId: 'business', // Will be replaced by actual logic if needed
                recipientId,
                text,
                isEcho: true,
                timestamp: new Date()
            });
        },

        /**
         * Send product cards as a Generic Template message
         * Products are displayed as carousel cards with image, title, price, and CTA button
         * Falls back to individual image+text messages if templates not supported
         */
        async sendProductCards(
            tenantId: string,
            accountId: string,
            recipientId: string,
            products: ProductCard[],
            ctaLabel: string = 'View Product'
        ) {
            const provider = await getProviderForAccount(tenantId, accountId);

            // Try Generic Template first (works if account has special permissions)
            try {
                const elements = products.slice(0, 10).map(product => ({
                    title: product.name,
                    subtitle: `${product.currency || '₹'}${product.price}${product.description ? ` - ${product.description}` : ''}`,
                    image_url: product.image,
                    default_action: product.url ? {
                        type: 'web_url' as const,
                        url: product.url
                    } : undefined,
                    buttons: product.url ? [{
                        type: 'web_url' as const,
                        title: ctaLabel,
                        url: product.url
                    }] : undefined
                }));

                const res = await provider.sendGenericTemplate(recipientId, elements);

                await messageRepo.save({
                    tenantId,
                    accountId,
                    igMessageId: res.message_id,
                    senderId: 'business',
                    recipientId,
                    text: `[Product Catalog: ${products.length} items]`,
                    isEcho: true,
                    timestamp: new Date()
                });
                return; // Success - template worked!
            } catch (templateErr: any) {
                // Template not supported - fall back to individual messages
                console.log(`[InboxService] Generic template not available, using image fallback: ${templateErr.message}`);
            }

            // Fallback: Send each product as image + text
            for (const product of products.slice(0, 5)) { // Limit to 5 to avoid spam
                try {
                    // Send product image
                    if (product.image) {
                        const imgRes = await provider.sendImage(recipientId, product.image);
                        await messageRepo.save({
                            tenantId,
                            accountId,
                            igMessageId: imgRes.message_id,
                            senderId: 'business',
                            recipientId,
                            text: `[Image: ${product.name}]`,
                            isEcho: true,
                            timestamp: new Date()
                        });
                    }

                    // Send product details text
                    const productText = `📦 *${product.name}*\n💰 ${product.currency || '₹'}${product.price}${product.description ? `\n${product.description}` : ''}${product.url ? `\n\n👉 ${ctaLabel}: ${product.url}` : ''}`;
                    
                    const txtRes = await provider.sendMessage(recipientId, productText);
                    await messageRepo.save({
                        tenantId,
                        accountId,
                        igMessageId: txtRes.message_id,
                        senderId: 'business',
                        recipientId,
                        text: productText,
                        isEcho: true,
                        timestamp: new Date()
                    });

                    // Small delay between products to avoid rate limits
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (err: any) {
                    console.error(`[InboxService] Failed to send product ${product.name}: ${err.message}`);
                }
            }

            // Send summary if more products
            if (products.length > 5) {
                const summaryText = `...and ${products.length - 5} more products! Visit our store for the full catalog.`;
                try {
                    await provider.sendMessage(recipientId, summaryText);
                } catch (err) {
                    // Ignore summary errors
                }
            }
        },

        /**
         * Send an image message
         */
        async sendImage(tenantId: string, accountId: string, recipientId: string, imageUrl: string) {
            const provider = await getProviderForAccount(tenantId, accountId);
            const res = await provider.sendImage(recipientId, imageUrl);

            await messageRepo.save({
                tenantId,
                accountId,
                igMessageId: res.message_id,
                senderId: 'business',
                recipientId,
                text: `[Image]`,
                isEcho: true,
                timestamp: new Date()
            });
        },

        /**
         * Send a text message with buttons
         */
        async sendButtonMessage(
            tenantId: string,
            accountId: string,
            recipientId: string,
            text: string,
            buttons: Array<{ label: string; url: string }>
        ) {
            const provider = await getProviderForAccount(tenantId, accountId);

            const formattedButtons = buttons.slice(0, 3).map(btn => ({
                type: 'web_url' as const,
                title: btn.label,
                url: btn.url
            }));

            const res = await provider.sendButtonTemplate(recipientId, text, formattedButtons);

            await messageRepo.save({
                tenantId,
                accountId,
                igMessageId: res.message_id,
                senderId: 'business',
                recipientId,
                text: `${text} [${buttons.length} buttons]`,
                isEcho: true,
                timestamp: new Date()
            });
        }
    };
}
