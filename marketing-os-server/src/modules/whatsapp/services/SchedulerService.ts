// services/SchedulerService.ts
// Background worker for processing delayed jobs like Scheduled Broadcasts and Cart Recovery

import cron from 'node-cron';
import { Pool } from 'pg';
import Cart from '../../../db/nosqlmodels/Cart.js';

export function createSchedulerService(
    pool: Pool,
    broadcastController: any,
    messageService: any,
    optInRepo: any,
    broadcastRepo: any
) {
    let broadcastTask: cron.ScheduledTask | null = null;
    let cartRecoveryTask: cron.ScheduledTask | null = null;

    const start = () => {
        // 1. Scheduled Broadcasts: Runs every minute
        broadcastTask = cron.schedule('* * * * *', async () => {
            try {
                // Find pending scheduled broadcasts whose scheduled time is in the past
                const query = `
                    SELECT * FROM whatsapp_broadcasts 
                    WHERE status = 'SCHEDULED' 
                    AND scheduled_at <= NOW()
                `;
                const result = await pool.query(query);
                const pendingBroadcasts = result.rows;

                if (pendingBroadcasts.length > 0) {
                    console.log(`[Scheduler] Found ${pendingBroadcasts.length} scheduled broadcast(s) ready to launch.`);
                }

                for (const broadcast of pendingBroadcasts) {
                    try {
                        // Mark as SENDING so we don't pick it up again
                        await pool.query(
                            `UPDATE whatsapp_broadcasts SET status = 'SENDING', started_at = NOW() WHERE id = $1`,
                            [broadcast.id]
                        );

                        console.log(`[Scheduler] Launching broadcast ${broadcast.id} for tenant ${broadcast.tenant_id}`);

                        // Background process the broadcast natively
                        processBroadcastInBackground(broadcast);
                    } catch (err) {
                        console.error(`[Scheduler] Error launching broadcast ${broadcast.id}:`, err);
                    }
                }
            } catch (err) {
                console.error('[Scheduler] Error checking for scheduled broadcasts:', err);
            }
        });

        // 2. Cart Recovery (Abandoned Carts): Runs every 15 minutes
        cartRecoveryTask = cron.schedule('*/15 * * * *', async () => {
            try {
                // Find active carts where updatedAt is older than 30 minutes, and no reminder sent yet
                // Status should still be active
                const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

                // Assuming we add a 'reminderSent' field to the Cart model or just use 'status' logic.
                // For now, let's find carts that are simply old and active.
                // We'd update status to 'abandoned' or similar after sending to prevent duplicate sends.
                const abandonedCarts = await Cart.find({
                    status: 'active',
                    updatedAt: { $lt: thirtyMinutesAgo },
                    // You might want a flag like 'recoveryTemplateSent: false' in a production scenario
                });

                if (abandonedCarts.length > 0) {
                    console.log(`[Scheduler] Found ${abandonedCarts.length} abandoned cart(s) for recovery.`);
                }

                for (const cart of abandonedCarts) {
                    try {
                        console.log(`[Scheduler] Sending cart recovery to user ${cart.userId} (Tenant: ${cart.tenantId})`);

                        // We use messageService to send the template directly
                        await messageService.sendTemplate({
                            tenantId: cart.tenantId,
                            recipientPhone: cart.userId,
                            templateName: 'cart_abandonment_reminder', // Ensure this template exists in Meta
                            language: 'en',
                            variables: {},
                            senderUserId: 'system',
                        });

                        // Update cart status so we don't spam them
                        cart.status = 'abandoned';
                        await cart.save();
                    } catch (err) {
                        console.error(`[Scheduler] Error sending recovery for cart ${cart._id}:`, err);
                    }
                }
            } catch (err) {
                console.error('[Scheduler] Error checking for abandoned carts:', err);
            }
        });

        console.log('[Scheduler] Background jobs started (Scheduled Broadcasts, Cart Recovery)');
    };

    const stop = () => {
        if (broadcastTask) broadcastTask.stop();
        if (cartRecoveryTask) cartRecoveryTask.stop();
        console.log('[Scheduler] Background jobs stopped');
    };

    // Helper to process broadcast bypassing the controller HTTP interface
    const processBroadcastInBackground = async (broadcast: any) => {
        // Reuse the logic from broadcast controller
        const eligible = broadcast.recipients || [];
        // Note: The controller already filtered opt-outs when it was initially saved.

        let successCount = 0;
        let failureCount = 0;

        for (const r of eligible) {
            try {
                const result = await messageService.sendTemplate({
                    tenantId: broadcast.tenant_id,
                    recipientPhone: r.phone,
                    templateName: broadcast.template_name,
                    language: broadcast.language || 'en',
                    variables: r.variables || {},
                    senderUserId: broadcast.created_by,
                });
                if (result.success) successCount++;
                else failureCount++;
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                failureCount++;
                console.error(`[Broadcast Background] Error sending to ${r.phone}:`, error);
            }
        }

        console.log(
            `[Broadcast Background] Completed ${broadcast.id}: ${successCount} sent, ${failureCount} failed`
        );

        if (broadcastRepo) {
            try {
                await broadcastRepo.updateStatus(broadcast.id, broadcast.tenant_id, {
                    status: failureCount === eligible.length && failureCount > 0 ? 'FAILED' : 'COMPLETED',
                    sentCount: successCount,
                    failedCount: failureCount,
                    completedAt: new Date(),
                });
            } catch (err) {
                console.warn('[Broadcast Background] Failed to update record:', err);
            }
        }
    };


    return { start, stop };
}

export type SchedulerService = ReturnType<typeof createSchedulerService>;
