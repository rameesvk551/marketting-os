// controllers/AccountController.ts
// Handles Instagram account connection, disconnection, and profile fetching.

import { Request, Response, NextFunction } from 'express';
import { IInstagramAuthService } from '../services/InstagramAuthService.js';
import { IInstagramAccountRepo } from '../repositories/InstagramAccountRepo.js';
import { logger } from '../../../config/logger.js';

export function createAccountController(
    authService: IInstagramAuthService,
    accountRepo: IInstagramAccountRepo,
) {
    return {
        /**
         * GET /instagram/connection — Get current connection status
         */
        getConnection: async (req: Request, res: Response, next: NextFunction) => {
            try {
                const tenantId = (req as any).context?.tenantId;
                if (!tenantId) {
                    return res.status(401).json({ status: 'error', message: 'Tenant required' });
                }
                const accounts = await accountRepo.findByTenant(tenantId);

                res.json({
                    status: 'success',
                    data: {
                        connected: accounts.length > 0,
                        accounts: accounts.map(a => ({
                            id: a.id,
                            igUserId: a.igUserId,
                            username: a.username,
                            name: a.name,
                            profilePictureUrl: a.profilePictureUrl,
                            followersCount: a.followersCount,
                            followsCount: a.followsCount,
                            mediaCount: a.mediaCount,
                            accountType: a.accountType,
                            status: a.status,
                            connectedAt: a.connectedAt,
                            lastSyncedAt: a.lastSyncedAt,
                        })),
                    },
                });
            } catch (error) {
                next(error);
            }
        },

        /**
         * POST /instagram/connect — Connect an Instagram account using an access token
         */
        connect: async (req: Request, res: Response, next: NextFunction) => {
            try {
                const tenantId = (req as any).context?.tenantId;
                if (!tenantId) {
                    return res.status(401).json({ status: 'error', message: 'Tenant required' });
                }
                const { accessToken, igUserId, code, redirectUri } = req.body;

                let token = accessToken;
                let userId: string | undefined;

                // If an authorization code is provided, exchange it
                if (code && redirectUri) {
                    const result = await authService.exchangeCodeForShortLivedToken(code, redirectUri);
                    token = result.accessToken;
                    userId = result.userId;

                    // Exchange for long-lived token
                    const longLived = await authService.exchangeForLongLivedToken(token);
                    token = longLived.accessToken;
                }

                // Fetch the profile
                // Do not pass igUserId if it is an IG Basic Display token (starts with IGAA)
                const isIgToken = token.startsWith('IG');
                const profile = await authService.getProfile(token, isIgToken ? undefined : igUserId);

                // Save to DB
                const account = await accountRepo.save({
                    tenantId,
                    igUserId: profile.id,
                    username: profile.username,
                    name: profile.name,
                    profilePictureUrl: profile.profilePictureUrl,
                    biography: profile.biography,
                    followersCount: profile.followersCount,
                    followsCount: profile.followsCount,
                    mediaCount: profile.mediaCount,
                    accountType: profile.accountType,
                    accessToken: token,
                    tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // ~60 days
                });

                logger.info(`[Instagram] Account @${profile.username} connected for tenant ${tenantId}`);

                res.json({
                    status: 'success',
                    data: {
                        id: account.id,
                        igUserId: account.igUserId,
                        username: account.username,
                        name: account.name,
                        profilePictureUrl: account.profilePictureUrl,
                        followersCount: account.followersCount,
                        status: account.status,
                    },
                });
            } catch (error) {
                next(error);
            }
        },

        /**
         * DELETE /instagram/disconnect/:accountId — Disconnect an Instagram account
         */
        disconnect: async (req: Request, res: Response, next: NextFunction) => {
            try {
                const tenantId = (req as any).context?.tenantId;
                if (!tenantId) {
                    return res.status(401).json({ status: 'error', message: 'Tenant required' });
                }
                const { accountId } = req.params;

                await accountRepo.delete(accountId, tenantId);
                logger.info(`[Instagram] Account ${accountId} disconnected for tenant ${tenantId}`);

                res.json({ status: 'success', message: 'Instagram account disconnected' });
            } catch (error) {
                next(error);
            }
        },

        /**
         * GET /instagram/profile/:accountId — Get account profile (re-fetches from IG API)
         */
        getProfile: async (req: Request, res: Response, next: NextFunction) => {
            try {
                const tenantId = (req as any).context?.tenantId;
                if (!tenantId) {
                    return res.status(401).json({ status: 'error', message: 'Tenant required' });
                }
                const { accountId } = req.params;

                const account = await accountRepo.findById(accountId, tenantId);
                if (!account) {
                    return res.status(404).json({ status: 'error', message: 'Account not found' });
                }

                const profile = await authService.getProfile(account.accessToken);

                // Update cached profile data
                await accountRepo.updateProfile(account.id, {
                    username: profile.username,
                    name: profile.name,
                    profilePictureUrl: profile.profilePictureUrl,
                    biography: profile.biography,
                    followersCount: profile.followersCount,
                    followsCount: profile.followsCount,
                    mediaCount: profile.mediaCount,
                });

                res.json({ status: 'success', data: profile });
            } catch (error) {
                next(error);
            }
        },

        /**
         * POST /instagram/refresh-token/:accountId — Refresh access token
         */
        refreshToken: async (req: Request, res: Response, next: NextFunction) => {
            try {
                const tenantId = (req as any).context?.tenantId;
                if (!tenantId) {
                    return res.status(401).json({ status: 'error', message: 'Tenant required' });
                }
                const { accountId } = req.params;

                const account = await accountRepo.findById(accountId, tenantId);
                if (!account) {
                    return res.status(404).json({ status: 'error', message: 'Account not found' });
                }

                const refreshed = await authService.refreshLongLivedToken(account.accessToken);
                const expiresAt = new Date(Date.now() + refreshed.expiresIn * 1000);

                await accountRepo.updateToken(account.id, refreshed.accessToken, expiresAt);

                res.json({
                    status: 'success',
                    message: 'Token refreshed',
                    data: { expiresAt },
                });
            } catch (error) {
                next(error);
            }
        },
    };
}
