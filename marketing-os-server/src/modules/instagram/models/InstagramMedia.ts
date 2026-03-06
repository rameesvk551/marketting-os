// models/InstagramMedia.ts
// Domain model for Instagram published media (posts, reels, stories, carousels).

export type MediaType = 'IMAGE' | 'VIDEO' | 'REELS' | 'CAROUSEL' | 'STORY';
export type MediaStatus = 'pending' | 'processing' | 'published' | 'failed' | 'scheduled';

export interface InstagramMedia {
    id: string;
    tenantId: string;
    accountId: string;
    igMediaId: string | null;
    containerId: string | null;
    mediaType: MediaType;
    caption: string | null;
    altText: string | null;
    mediaUrl: string | null;
    thumbnailUrl: string | null;
    permalink: string | null;
    status: MediaStatus;
    likeCount: number;
    commentsCount: number;
    impressions: number;
    reach: number;
    engagement: number;
    saves: number;
    shares: number;
    publishedAt: Date | null;
    scheduledAt: Date | null;
    errorMessage: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateMediaInput {
    tenantId: string;
    accountId: string;
    mediaType: MediaType;
    caption?: string;
    altText?: string;
    mediaUrl: string;
    scheduledAt?: Date;
}

export interface InstagramMediaRow {
    id: string;
    tenant_id: string;
    account_id: string;
    ig_media_id: string | null;
    container_id: string | null;
    media_type: string;
    caption: string | null;
    alt_text: string | null;
    media_url: string | null;
    thumbnail_url: string | null;
    permalink: string | null;
    status: string;
    like_count: number;
    comments_count: number;
    impressions: number;
    reach: number;
    engagement: number;
    saves: number;
    shares: number;
    published_at: string | null;
    scheduled_at: string | null;
    error_message: string | null;
    created_at: string;
    updated_at: string;
}

export function mapRowToMedia(row: InstagramMediaRow): InstagramMedia {
    return {
        id: row.id,
        tenantId: row.tenant_id,
        accountId: row.account_id,
        igMediaId: row.ig_media_id,
        containerId: row.container_id,
        mediaType: row.media_type as MediaType,
        caption: row.caption,
        altText: row.alt_text,
        mediaUrl: row.media_url,
        thumbnailUrl: row.thumbnail_url,
        permalink: row.permalink,
        status: row.status as MediaStatus,
        likeCount: row.like_count,
        commentsCount: row.comments_count,
        impressions: row.impressions,
        reach: row.reach,
        engagement: row.engagement,
        saves: row.saves,
        shares: row.shares,
        publishedAt: row.published_at ? new Date(row.published_at) : null,
        scheduledAt: row.scheduled_at ? new Date(row.scheduled_at) : null,
        errorMessage: row.error_message,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
}
