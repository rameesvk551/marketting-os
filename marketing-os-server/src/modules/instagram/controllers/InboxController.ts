// controllers/InboxController.ts
// Exposes Instagram Comments and DMs.

import { Request, Response } from 'express';
import { IInboxService } from '../services/InboxService.js';
import { logger } from '../../../config/logger.js';

export function createInboxController(inboxService: IInboxService) {
    return {
        getComments: async (req: Request, res: Response) => {
            try {
                const tenantId = (req as any).context?.tenantId;
                if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant required' });
                const { accountId } = req.query;

                const comments = await inboxService.getComments(tenantId, accountId as string);
                res.json({ status: 'success', data: comments });
            } catch (error: any) {
                logger.error(`[IG Inbox] getComments error: ${error.message}`);
                res.status(500).json({ status: 'error', message: error.message });
            }
        },

        replyToComment: async (req: Request, res: Response) => {
            try {
                const tenantId = (req as any).context?.tenantId;
                if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant required' });
                const { accountId, commentId } = req.params;
                const { text } = req.body;

                if (!text) return res.status(400).json({ status: 'error', message: 'Text is required' });

                await inboxService.replyToComment(tenantId, accountId, commentId, text);
                res.json({ status: 'success', message: 'Reply sent successfully' });
            } catch (error: any) {
                logger.error(`[IG Inbox] replyToComment error: ${error.message}`);
                res.status(500).json({ status: 'error', message: error.message });
            }
        },

        privateReplyToComment: async (req: Request, res: Response) => {
            try {
                const tenantId = (req as any).context?.tenantId;
                if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant required' });
                const { accountId, commentId } = req.params;
                const { text } = req.body;

                if (!text) return res.status(400).json({ status: 'error', message: 'Text is required' });

                await inboxService.privateReplyToComment(tenantId, accountId, commentId, text);
                res.json({ status: 'success', message: 'Private reply sent via DM' });
            } catch (error: any) {
                logger.error(`[IG Inbox] privateReplyToComment error: ${error.message}`);
                res.status(500).json({ status: 'error', message: error.message });
            }
        },

        deleteComment: async (req: Request, res: Response) => {
            try {
                const tenantId = (req as any).context?.tenantId;
                if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant required' });
                const { accountId, commentId } = req.params;

                await inboxService.deleteComment(tenantId, accountId, commentId);
                res.json({ status: 'success', message: 'Comment deleted successfully' });
            } catch (error: any) {
                logger.error(`[IG Inbox] deleteComment error: ${error.message}`);
                res.status(500).json({ status: 'error', message: error.message });
            }
        },

        getMessages: async (req: Request, res: Response) => {
            try {
                const tenantId = (req as any).context?.tenantId;
                if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant required' });
                const { accountId } = req.query;

                const messages = await inboxService.getMessages(tenantId, accountId as string);
                res.json({ status: 'success', data: messages });
            } catch (error: any) {
                logger.error(`[IG Inbox] getMessages error: ${error.message}`);
                res.status(500).json({ status: 'error', message: error.message });
            }
        },

        sendMessage: async (req: Request, res: Response) => {
            try {
                const tenantId = (req as any).context?.tenantId;
                if (!tenantId) return res.status(401).json({ status: 'error', message: 'Tenant required' });
                const { accountId } = req.params;
                const { recipientId, text } = req.body;

                if (!recipientId || !text) return res.status(400).json({ status: 'error', message: 'recipientId and text are required' });

                await inboxService.sendMessage(tenantId, accountId, recipientId, text);
                res.json({ status: 'success', message: 'Message sent successfully' });
            } catch (error: any) {
                logger.error(`[IG Inbox] sendMessage error: ${error.message}`);
                res.status(500).json({ status: 'error', message: error.message });
            }
        }
    };
}
