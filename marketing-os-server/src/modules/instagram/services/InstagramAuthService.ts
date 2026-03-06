// services/InstagramAuthService.ts
// Manages Instagram OAuth token exchange, refresh, and profile fetching.

import { logger } from '../../../config/logger.js';

const GRAPH_API_BASE = 'https://graph.instagram.com';

export interface IInstagramAuthService {
    exchangeCodeForShortLivedToken(code: string, redirectUri: string): Promise<{ accessToken: string; userId: string }>;
    exchangeForLongLivedToken(shortLivedToken: string): Promise<{ accessToken: string; expiresIn: number }>;
    refreshLongLivedToken(token: string): Promise<{ accessToken: string; expiresIn: number }>;
    getProfile(accessToken: string): Promise<InstagramProfileData>;
}

export interface InstagramProfileData {
    id: string;
    username: string;
    name: string;
    biography: string;
    profilePictureUrl: string;
    followersCount: number;
    followsCount: number;
    mediaCount: number;
    accountType: string;
}

export function createInstagramAuthService(appId: string, appSecret: string, apiVersion: string): IInstagramAuthService {
    return {
        async exchangeCodeForShortLivedToken(code: string, redirectUri: string) {
            const response = await fetch(`${GRAPH_API_BASE}/oauth/access_token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: appId,
                    client_secret: appSecret,
                    grant_type: 'authorization_code',
                    redirect_uri: redirectUri,
                    code,
                }),
            });

            const data: any = await response.json();
            if (!response.ok) {
                logger.error('[Instagram Auth] Token exchange failed:', data);
                throw new Error(data.error_message || 'Failed to exchange code for token');
            }

            return {
                accessToken: data.access_token,
                userId: data.user_id?.toString(),
            };
        },

        async exchangeForLongLivedToken(shortLivedToken: string) {
            const params = new URLSearchParams({
                grant_type: 'ig_exchange_token',
                client_secret: appSecret,
                access_token: shortLivedToken,
            });

            const response = await fetch(`${GRAPH_API_BASE}/access_token?${params}`);
            const data: any = await response.json();

            if (!response.ok) {
                logger.error('[Instagram Auth] Long-lived token exchange failed:', data);
                throw new Error(data.error_message || 'Failed to get long-lived token');
            }

            logger.info(`[Instagram Auth] Got long-lived token, expires in ${data.expires_in}s`);
            return {
                accessToken: data.access_token,
                expiresIn: data.expires_in,
            };
        },

        async refreshLongLivedToken(token: string) {
            const params = new URLSearchParams({
                grant_type: 'ig_refresh_token',
                access_token: token,
            });

            const response = await fetch(`${GRAPH_API_BASE}/refresh_access_token?${params}`);
            const data: any = await response.json();

            if (!response.ok) {
                logger.error('[Instagram Auth] Token refresh failed:', data);
                throw new Error(data.error_message || 'Failed to refresh token');
            }

            logger.info(`[Instagram Auth] Refreshed token, new expiry in ${data.expires_in}s`);
            return {
                accessToken: data.access_token,
                expiresIn: data.expires_in,
            };
        },

        async getProfile(accessToken: string): Promise<InstagramProfileData> {
            const fields = 'id,username,name,biography,profile_picture_url,followers_count,follows_count,media_count,account_type';
            const response = await fetch(
                `${GRAPH_API_BASE}/${apiVersion}/me?fields=${fields}&access_token=${accessToken}`,
            );
            const data: any = await response.json();

            if (!response.ok) {
                logger.error('[Instagram Auth] Profile fetch failed:', data);
                throw new Error(data.error?.message || 'Failed to fetch profile');
            }

            return {
                id: data.id,
                username: data.username || '',
                name: data.name || '',
                biography: data.biography || '',
                profilePictureUrl: data.profile_picture_url || '',
                followersCount: data.followers_count || 0,
                followsCount: data.follows_count || 0,
                mediaCount: data.media_count || 0,
                accountType: data.account_type || 'BUSINESS',
            };
        },
    };
}

