// models/InstagramComment.ts
// Domain model for Instagram Comments.

export interface InstagramComment {
    id: string;
    tenantId: string;
    accountId: string;
    mediaId: string;
    igCommentId: string;
    igMediaId: string;
    fromUsername: string;
    fromId: string | null;
    text: string;
    parentId: string | null;
    isHidden: boolean;
    likeCount: number;
    timestamp: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateInstagramCommentInput {
    tenantId: string;
    accountId: string;
    mediaId: string;
    igCommentId: string;
    igMediaId: string;
    fromUsername: string;
    fromId?: string;
    text: string;
    parentId?: string;
    isHidden?: boolean;
    likeCount?: number;
    timestamp: Date;
}

export interface InstagramCommentRow {
    id: string;
    tenant_id: string;
    account_id: string;
    media_id: string;
    ig_comment_id: string;
    ig_media_id: string;
    from_username: string;
    from_id: string | null;
    text: string;
    parent_id: string | null;
    is_hidden: boolean;
    like_count: number;
    timestamp: string;
    created_at: string;
    updated_at: string;
}

export function mapRowToInstagramComment(row: InstagramCommentRow): InstagramComment {
    return {
        id: row.id,
        tenantId: row.tenant_id,
        accountId: row.account_id,
        mediaId: row.media_id,
        igCommentId: row.ig_comment_id,
        igMediaId: row.ig_media_id,
        fromUsername: row.from_username,
        fromId: row.from_id,
        text: row.text,
        parentId: row.parent_id,
        isHidden: row.is_hidden,
        likeCount: row.like_count,
        timestamp: new Date(row.timestamp),
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
}
