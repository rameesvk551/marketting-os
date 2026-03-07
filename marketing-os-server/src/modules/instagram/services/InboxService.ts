// services/InboxService.ts
// Handles business logic for fetching and responding to Instagram comments and messages.

import { IInstagramCommentRepo } from '../repositories/InstagramCommentRepo.js';
import { IInstagramMessageRepo } from '../repositories/InstagramMessageRepo.js';
import { IInstagramAccountRepo } from '../repositories/InstagramAccountRepo.js';
import { IInstagramGraphApiProvider } from '../providers/InstagramGraphApiProvider.js';

export interface IInboxService {
    getComments(tenantId: string, accountId?: string): Promise<any[]>;
    replyToComment(tenantId: string, accountId: string, commentId: string, text: string): Promise<void>;
    privateReplyToComment(tenantId: string, accountId: string, commentId: string, text: string): Promise<void>;
    deleteComment(tenantId: string, accountId: string, commentId: string): Promise<void>;
    getMessages(tenantId: string, accountId?: string): Promise<any[]>;
    sendMessage(tenantId: string, accountId: string, recipientId: string, text: string): Promise<void>;
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
        }
    };
}
