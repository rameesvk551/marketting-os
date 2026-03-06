// repositories/InstagramAccountRepo.ts
// CRUD operations for connected Instagram accounts.

import { Pool } from 'pg';
import {
    InstagramAccount,
    InstagramAccountRow,
    CreateInstagramAccountInput,
    mapRowToAccount,
} from '../models/InstagramAccount.js';

export interface IInstagramAccountRepo {
    findByTenant(tenantId: string): Promise<InstagramAccount[]>;
    findById(id: string, tenantId: string): Promise<InstagramAccount | null>;
    findByIgUserId(igUserId: string, tenantId: string): Promise<InstagramAccount | null>;
    save(input: CreateInstagramAccountInput): Promise<InstagramAccount>;
    updateToken(id: string, accessToken: string, expiresAt?: Date): Promise<void>;
    updateProfile(id: string, updates: Partial<Pick<InstagramAccount, 'username' | 'name' | 'profilePictureUrl' | 'biography' | 'followersCount' | 'followsCount' | 'mediaCount'>>): Promise<void>;
    updateStatus(id: string, status: InstagramAccount['status']): Promise<void>;
    delete(id: string, tenantId: string): Promise<void>;
}

export function createInstagramAccountRepo(pool: Pool): IInstagramAccountRepo {
    return {
        async findByTenant(tenantId: string): Promise<InstagramAccount[]> {
            const { rows } = await pool.query<InstagramAccountRow>(
                `SELECT * FROM instagram_accounts WHERE tenant_id = $1 ORDER BY connected_at DESC`,
                [tenantId],
            );
            return rows.map(mapRowToAccount);
        },

        async findById(id: string, tenantId: string): Promise<InstagramAccount | null> {
            const { rows } = await pool.query<InstagramAccountRow>(
                `SELECT * FROM instagram_accounts WHERE id = $1 AND tenant_id = $2`,
                [id, tenantId],
            );
            return rows[0] ? mapRowToAccount(rows[0]) : null;
        },

        async findByIgUserId(igUserId: string, tenantId: string): Promise<InstagramAccount | null> {
            const { rows } = await pool.query<InstagramAccountRow>(
                `SELECT * FROM instagram_accounts WHERE ig_user_id = $1 AND tenant_id = $2`,
                [igUserId, tenantId],
            );
            return rows[0] ? mapRowToAccount(rows[0]) : null;
        },

        async save(input: CreateInstagramAccountInput): Promise<InstagramAccount> {
            const { rows } = await pool.query<InstagramAccountRow>(
                `INSERT INTO instagram_accounts
                    (tenant_id, ig_user_id, username, name, profile_picture_url, biography,
                     followers_count, follows_count, media_count, account_type, access_token,
                     token_expires_at, page_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                 ON CONFLICT (tenant_id, ig_user_id)
                 DO UPDATE SET
                    username = EXCLUDED.username,
                    name = EXCLUDED.name,
                    profile_picture_url = EXCLUDED.profile_picture_url,
                    biography = EXCLUDED.biography,
                    followers_count = EXCLUDED.followers_count,
                    follows_count = EXCLUDED.follows_count,
                    media_count = EXCLUDED.media_count,
                    access_token = EXCLUDED.access_token,
                    token_expires_at = EXCLUDED.token_expires_at,
                    page_id = EXCLUDED.page_id,
                    status = 'active',
                    updated_at = NOW()
                 RETURNING *`,
                [
                    input.tenantId,
                    input.igUserId,
                    input.username || null,
                    input.name || null,
                    input.profilePictureUrl || null,
                    input.biography || null,
                    input.followersCount || 0,
                    input.followsCount || 0,
                    input.mediaCount || 0,
                    input.accountType || 'BUSINESS',
                    input.accessToken,
                    input.tokenExpiresAt || null,
                    input.pageId || null,
                ],
            );
            return mapRowToAccount(rows[0]);
        },

        async updateToken(id: string, accessToken: string, expiresAt?: Date): Promise<void> {
            await pool.query(
                `UPDATE instagram_accounts
                 SET access_token = $1, token_expires_at = $2, status = 'active', updated_at = NOW()
                 WHERE id = $3`,
                [accessToken, expiresAt || null, id],
            );
        },

        async updateProfile(id: string, updates: Record<string, any>): Promise<void> {
            const setClauses: string[] = [];
            const values: any[] = [];
            let idx = 1;

            const columnMap: Record<string, string> = {
                username: 'username',
                name: 'name',
                profilePictureUrl: 'profile_picture_url',
                biography: 'biography',
                followersCount: 'followers_count',
                followsCount: 'follows_count',
                mediaCount: 'media_count',
            };

            for (const [key, column] of Object.entries(columnMap)) {
                if (updates[key] !== undefined) {
                    setClauses.push(`${column} = $${idx}`);
                    values.push(updates[key]);
                    idx++;
                }
            }

            if (setClauses.length === 0) return;

            setClauses.push(`last_synced_at = NOW()`);
            setClauses.push(`updated_at = NOW()`);
            values.push(id);

            await pool.query(
                `UPDATE instagram_accounts SET ${setClauses.join(', ')} WHERE id = $${idx}`,
                values,
            );
        },

        async updateStatus(id: string, status: InstagramAccount['status']): Promise<void> {
            await pool.query(
                `UPDATE instagram_accounts SET status = $1, updated_at = NOW() WHERE id = $2`,
                [status, id],
            );
        },

        async delete(id: string, tenantId: string): Promise<void> {
            await pool.query(
                `DELETE FROM instagram_accounts WHERE id = $1 AND tenant_id = $2`,
                [id, tenantId],
            );
        },
    };
}
