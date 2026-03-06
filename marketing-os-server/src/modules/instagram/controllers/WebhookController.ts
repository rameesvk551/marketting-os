// controllers/WebhookController.ts
// Handles Instagram webhook verification and event processing.

import { Request, Response, NextFunction } from 'express';
import { IWebhookService } from '../services/WebhookService.js';
import { logger } from '../../../config/logger.js';

export function createInstagramWebhookController(
    webhookService: IWebhookService,
    verifyToken: string,
) {
    return {
        /**
         * GET /instagram/webhook — Meta webhook verification challenge
         */
        verifyChallenge: (req: Request, res: Response) => {
            const mode = req.query['hub.mode'];
            const token = req.query['hub.verify_token'];
            const challenge = req.query['hub.challenge'];

            if (mode === 'subscribe' && token === verifyToken) {
                logger.info('[IG Webhook] Verification challenge accepted');
                res.status(200).send(challenge);
            } else {
                logger.warn('[IG Webhook] Verification challenge rejected');
                res.sendStatus(403);
            }
        },

        /**
         * POST /instagram/webhook — Process incoming webhook events
         */
        handleWebhook: async (req: Request, res: Response, _next: NextFunction) => {
            try {
                // Always respond 200 immediately to avoid retries from Meta
                res.sendStatus(200);

                // Process asynchronously
                await webhookService.processWebhook(req.body);
            } catch (error: any) {
                // Don't fail the HTTP response — already sent 200
                logger.error(`[IG Webhook] Processing error: ${error.message}`);
            }
        },
    };
}
