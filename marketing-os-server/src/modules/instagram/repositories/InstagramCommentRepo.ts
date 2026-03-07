// repositories/InstagramCommentRepo.ts
// CRUD operations for Instagram Comments.

import { Pool } from 'pg';
import {
    InstagramComment,
    InstagramCommentRow,
    CreateInstagramCommentInput,
    mapRowToInstagramComment,
} from '../models/InstagramComment.js';

export interface IInstagramCommentRepo {
    findByTenant(tenantId: string, limit?: number, offset?: number): Promise<InstagramComment[]>;
    findByMedia(mediaId: string, tenantId: string): Promise<InstagramComment[]>;
    save(input: CreateInstagramCommentInput): Promise<InstagramComment>;
    updateVisibility(id: string, tenantId: string, isHidden: boolean): Promise<void>;
}

export function createInstagramCommentRepo(pool: Pool): IInstagramCommentRepo {
    return {
        async findByTenant(tenantId: string, limit = 50, offset = 0): Promise<InstagramComment[]> {
            const { rows } = await pool.query<InstagramCommentRow>(
                `SELECT * FROM instagram_comments 
                 WHERE tenant_id = $1 
                 ORDER BY timestamp DESC
                 LIMIT $2 OFFSET $3`,
                [tenantId, limit, offset],
            );
            return rows.map(mapRowToInstagramComment);
        },

        async findByMedia(mediaId: string, tenantId: string): Promise<InstagramComment[]> {
            const { rows } = await pool.query<InstagramCommentRow>(
                `SELECT * FROM instagram_comments 
                 WHERE media_id = $1 AND tenant_id = $2 
                 ORDER BY timestamp ASC`,
                [mediaId, tenantId],
            );
            return rows.map(mapRowToInstagramComment);
        },

        async save(input: CreateInstagramCommentInput): Promise<InstagramComment> {
            const { rows } = await pool.query<InstagramCommentRow>(
                `INSERT INTO instagram_comments
                    (tenant_id, account_id, media_id, ig_comment_id, ig_media_id, from_username, 
                     from_id, text, parent_id, is_hidden, like_count, timestamp)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                 ON CONFLICT (ig_comment_id) 
                 DO UPDATE SET
                    text = EXCLUDED.text,
                    is_hidden = EXCLUDED.is_hidden,
                    like_count = EXCLUDED.like_count,
                    updated_at = NOW()
                 RETURNING *`,
                [
                    input.tenantId,
                    input.accountId,
                    input.mediaId,
                    input.igCommentId,
                    input.igMediaId,
                    input.fromUsername,
                    input.fromId || null,
                    input.text,
                    input.parentId || null,
                    input.isHidden || false,
                    input.likeCount || 0,
                    input.timestamp,
                ],
            );
            return mapRowToInstagramComment(rows[0]);
        },

        async updateVisibility(id: string, tenantId: string, isHidden: boolean): Promise<void> {
            await pool.query(
                `UPDATE instagram_comments SET is_hidden = $1, updated_at = NOW() 
                 WHERE id = $2 AND tenant_id = $3`,
                [isHidden, id, tenantId],
            );
        },
    };
}
