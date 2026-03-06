// models/InstagramAccount.ts
// Domain model for connected Instagram Business accounts.

export interface InstagramAccount {
    id: string;
    tenantId: string;
    igUserId: string;
    username: string | null;
    name: string | null;
    profilePictureUrl: string | null;
    biography: string | null;
    followersCount: number;
    followsCount: number;
    mediaCount: number;
    accountType: 'BUSINESS' | 'CREATOR' | 'PERSONAL';
    accessToken: string;
    tokenExpiresAt: Date | null;
    pageId: string | null;
    status: 'active' | 'disconnected' | 'token_expired';
    connectedAt: Date;
    lastSyncedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateInstagramAccountInput {
    tenantId: string;
    igUserId: string;
    username?: string;
    name?: string;
    profilePictureUrl?: string;
    biography?: string;
    followersCount?: number;
    followsCount?: number;
    mediaCount?: number;
    accountType?: string;
    accessToken: string;
    tokenExpiresAt?: Date;
    pageId?: string;
}

export interface InstagramAccountRow {
    id: string;
    tenant_id: string;
    ig_user_id: string;
    username: string | null;
    name: string | null;
    profile_picture_url: string | null;
    biography: string | null;
    followers_count: number;
    follows_count: number;
    media_count: number;
    account_type: string;
    access_token: string;
    token_expires_at: string | null;
    page_id: string | null;
    status: string;
    connected_at: string;
    last_synced_at: string | null;
    created_at: string;
    updated_at: string;
}

export function mapRowToAccount(row: InstagramAccountRow): InstagramAccount {
    return {
        id: row.id,
        tenantId: row.tenant_id,
        igUserId: row.ig_user_id,
        username: row.username,
        name: row.name,
        profilePictureUrl: row.profile_picture_url,
        biography: row.biography,
        followersCount: row.followers_count,
        followsCount: row.follows_count,
        mediaCount: row.media_count,
        accountType: row.account_type as InstagramAccount['accountType'],
        accessToken: row.access_token,
        tokenExpiresAt: row.token_expires_at ? new Date(row.token_expires_at) : null,
        pageId: row.page_id,
        status: row.status as InstagramAccount['status'],
        connectedAt: new Date(row.connected_at),
        lastSyncedAt: row.last_synced_at ? new Date(row.last_synced_at) : null,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
}
