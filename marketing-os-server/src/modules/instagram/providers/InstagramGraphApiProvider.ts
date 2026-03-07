// providers/InstagramGraphApiProvider.ts
// Instagram Graph API adapter — wraps all Meta Graph API calls for Instagram.

import { logger } from '../../../config/logger.js';

export interface InstagramApiConfig {
    accessToken: string;
    igUserId: string;
    apiVersion: string;
}

export interface MediaContainerParams {
    image_url?: string;
    video_url?: string;
    caption?: string;
    alt_text?: string;
    media_type?: 'IMAGE' | 'VIDEO' | 'REELS' | 'STORIES' | 'CAROUSEL';
    children?: string[];       // For carousel: array of container IDs
    is_carousel_item?: boolean;
    share_to_feed?: boolean;   // For reels
}

export interface ContainerStatusResponse {
    id: string;
    status_code: 'EXPIRED' | 'ERROR' | 'FINISHED' | 'IN_PROGRESS' | 'PUBLISHED';
    status?: string;
}

export interface PublishResult {
    id: string;   // ig media ID
}

export interface PublishingLimitResponse {
    quota_usage: number;
    config: {
        quota_total: number;
        quota_duration: number;
    };
}

export interface UserProfileResponse {
    id: string;
    username: string;
    name: string;
    biography: string;
    profile_picture_url: string;
    followers_count: number;
    follows_count: number;
    media_count: number;
    account_type: string;
}

export interface MediaInsight {
    name: string;
    period: string;
    values: Array<{ value: number }>;
    title: string;
    description: string;
    id: string;
}

export interface IInstagramGraphApiProvider {
    createMediaContainer(params: MediaContainerParams): Promise<string>;
    publishMedia(containerId: string): Promise<PublishResult>;
    getContainerStatus(containerId: string): Promise<ContainerStatusResponse>;
    getOEmbed(url: string): Promise<any>;
    getPublishingLimit(): Promise<PublishingLimitResponse>;
    getUserProfile(): Promise<UserProfileResponse>;
    getAccountInsights(metrics: string[], period: string): Promise<MediaInsight[]>;
    getMediaInsights(mediaId: string, metrics: string[]): Promise<MediaInsight[]>;
    getMedia(limit?: number): Promise<any>;
    replyToComment(commentId: string, message: string): Promise<{ id: string }>;
    deleteComment(commentId: string): Promise<{ success: boolean }>;
    sendPrivateReply(commentId: string, message: string): Promise<{ id: string }>;
    sendMessage(recipientId: string, text: string): Promise<{ message_id: string }>;
}

const GRAPH_API_BASE = 'https://graph.instagram.com';

export function createInstagramGraphApiProvider(config: InstagramApiConfig): IInstagramGraphApiProvider {
    const { accessToken, igUserId, apiVersion } = config;
    const baseUrl = `${GRAPH_API_BASE}/${apiVersion}`;

    async function graphFetch(url: string, options: RequestInit = {}): Promise<any> {
        const separator = url.includes('?') ? '&' : '?';
        const fullUrl = `${url}${separator}access_token=${accessToken}`;

        logger.debug(`[Instagram API] ${options.method || 'GET'} ${url}`);

        const response = await fetch(fullUrl, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        const data: any = await response.json();

        if (!response.ok) {
            const errorMsg = data?.error?.message || `HTTP ${response.status}`;
            const errorCode = data?.error?.code || response.status;
            logger.error(`[Instagram API] Error ${errorCode}: ${errorMsg}`);
            throw new Error(`Instagram API Error (${errorCode}): ${errorMsg}`);
        }

        return data;
    }

    return {
        /**
         * Step 1: Create a media container (upload image/video URL)
         */
        async createMediaContainer(params: MediaContainerParams): Promise<string> {
            const body: Record<string, any> = {};

            if (params.image_url) body.image_url = params.image_url;
            if (params.video_url) body.video_url = params.video_url;
            if (params.caption) body.caption = params.caption;
            if (params.alt_text) body.alt_text = params.alt_text;
            if (params.media_type) body.media_type = params.media_type;
            if (params.children) body.children = params.children.join(',');
            if (params.is_carousel_item) body.is_carousel_item = true;
            if (params.share_to_feed !== undefined) body.share_to_feed = params.share_to_feed;

            const queryParams = new URLSearchParams(body).toString();
            const data = await graphFetch(
                `${baseUrl}/${igUserId}/media?${queryParams}`,
                { method: 'POST' },
            );

            logger.info(`[Instagram] Created media container: ${data.id}`);
            return data.id;
        },

        /**
         * Step 2: Publish the container
         */
        async publishMedia(containerId: string): Promise<PublishResult> {
            const data = await graphFetch(
                `${baseUrl}/${igUserId}/media_publish?creation_id=${containerId}`,
                { method: 'POST' },
            );

            logger.info(`[Instagram] Published media: ${data.id}`);
            return { id: data.id };
        },

        /**
         * Step 3: Check container status
         */
        async getContainerStatus(containerId: string): Promise<ContainerStatusResponse> {
            return graphFetch(
                `${baseUrl}/${containerId}?fields=status_code,status`,
            );
        },

        /**
         * Check publishing rate limit (50 posts / 24 hours)
         */
        async getPublishingLimit(): Promise<PublishingLimitResponse> {
            const data = await graphFetch(
                `${baseUrl}/${igUserId}/content_publishing_limit?fields=quota_usage,config`,
            );
            return data;
        },

        /**
         * Get oEmbed data for an Instagram URL
         */
        async getOEmbed(url: string): Promise<any> {
            // oEmbed endpoint requires the url to be encoded
            const data = await graphFetch(
                `${baseUrl}/instagram_oembed?url=${encodeURIComponent(url)}`,
            );
            return data;
        },

        /**
         * Get Instagram user profile
         */
        async getUserProfile(): Promise<UserProfileResponse> {
            return graphFetch(
                `${baseUrl}/${igUserId}?fields=id,username,name,biography,profile_picture_url,followers_count,follows_count,media_count,account_type`,
            );
        },

        /**
         * Get insights for the Instagram account
         */
        async getAccountInsights(metrics: string[], period: string): Promise<MediaInsight[]> {
            const data = await graphFetch(
                `${baseUrl}/${igUserId}/insights?metric=${metrics.join(',')}&period=${period}`,
            );
            return data.data || [];
        },

        /**
         * Get insights for a specific media
         */
        async getMediaInsights(mediaId: string, metrics: string[]): Promise<MediaInsight[]> {
            const data = await graphFetch(
                `${baseUrl}/${mediaId}/insights?metric=${metrics.join(',')}`,
            );
            return data.data || [];
        },

        /**
         * Get recent media for the account
         */
        async getMedia(limit = 25): Promise<any> {
            return graphFetch(
                `${baseUrl}/${igUserId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=${limit}`,
            );
        },

        /**
         * Reply to a comment
         */
        async replyToComment(commentId: string, message: string): Promise<{ id: string }> {
            const data = await graphFetch(
                `${baseUrl}/${commentId}/replies?message=${encodeURIComponent(message)}`,
                { method: 'POST' }
            );
            return { id: data.id };
        },

        /**
         * Delete a comment
         */
        async deleteComment(commentId: string): Promise<{ success: boolean }> {
            const data = await graphFetch(
                `${baseUrl}/${commentId}`,
                { method: 'DELETE' }
            );
            return { success: data.success };
        },

        /**
         * Send a Private Reply to a comment via DM
         */
        async sendPrivateReply(commentId: string, message: string): Promise<{ id: string }> {
            const data = await graphFetch(
                `${baseUrl}/${commentId}/private_replies?message=${encodeURIComponent(message)}`,
                { method: 'POST' }
            );
            return { id: data.id };
        },

        /**
         * Send a Direct Message
         */
        async sendMessage(recipientId: string, text: string): Promise<{ message_id: string }> {
            const body = {
                recipient: { id: recipientId },
                message: { text }
            };
            const data = await graphFetch(
                `${baseUrl}/${igUserId}/messages`,
                {
                    method: 'POST',
                    body: JSON.stringify(body)
                }
            );
            return { message_id: data.message_id };
        },
    };
}
