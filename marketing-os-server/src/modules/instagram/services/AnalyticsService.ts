// services/AnalyticsService.ts
// Service for fetching and aggregating Instagram Analytics.

import { IInstagramAccountRepo } from '../repositories/InstagramAccountRepo.js';
import { IInstagramMediaRepo } from '../repositories/InstagramMediaRepo.js';
import { IInstagramGraphApiProvider } from '../providers/InstagramGraphApiProvider.js';

export interface IAnalyticsService {
    getAccountInsights(tenantId: string, accountId: string, period?: string): Promise<any>;
    getMediaAnalytics(tenantId: string, accountId: string, limit?: number): Promise<any>;
}

export function createAnalyticsService(
    accountRepo: IInstagramAccountRepo,
    mediaRepo: IInstagramMediaRepo,
    createProvider: (accessToken: string, igUserId: string) => IInstagramGraphApiProvider
): IAnalyticsService {

    async function getProviderForAccount(tenantId: string, accountId: string) {
        const account = await accountRepo.findById(accountId, tenantId);
        if (!account) throw new Error("Instagram account not found or not owned by tenant");
        if (!account.accessToken) throw new Error("Instagram account has no access token");
        return createProvider(account.accessToken, account.igUserId);
    }

    return {
        async getAccountInsights(tenantId: string, accountId: string, period = 'day') {
            const provider = await getProviderForAccount(tenantId, accountId);
            // Default metrics for an IG account
            const metrics = ['impressions', 'reach', 'profile_views'];

            try {
                const insights = await provider.getAccountInsights(metrics, period);
                return insights;
            } catch (error: any) {
                // If the account doesn't have enough data, Meta API might throw an error.
                if (error.message.includes('100')) {
                    return { message: "Not enough data available for this account type or period." };
                }
                throw error;
            }
        },

        async getMediaAnalytics(tenantId: string, accountId: string, limit = 50) {
            // First fetch local media with engagement stats
            const result = await mediaRepo.findByTenant(tenantId, { limit });

            // Filter down to just the requested account
            const accountMedia = result.items.filter(m => m.accountId === accountId);

            // Note: If we need real-time data, we could map over the items and call provider.getMediaInsights, 
            // but the quota limits make it safer to rely on webhook updates or a cron job.
            // For now, we return our local cache.
            return accountMedia;
        }
    };
}
