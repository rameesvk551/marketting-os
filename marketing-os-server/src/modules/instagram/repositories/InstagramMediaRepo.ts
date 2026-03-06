// repositories/InstagramMediaRepo.ts
// CRUD operations for Instagram published media tracking.

import { Pool } from 'pg';
import {
    InstagramMedia,
    InstagramMediaRow,
    CreateMediaInput,
    MediaStatus,
    mapRowToMedia,
} from '../models/InstagramMedia.js';

export interface IInstagramMediaRepo {
    findByTenant(tenantId: string, filters?: { status?: string; mediaType?: string; limit?: number; offset?: number }): Promise<{ items: InstagramMedia[]; total: number }>;
    findById(id: string, tenantId: string): Promise<InstagramMedia | null>;
    findByIgMediaId(igMediaId: string): Promise<InstagramMedia | null>;
    save(input: CreateMediaInput): Promise<InstagramMedia>;
    updateStatus(id: string, status: MediaStatus, extra?: { igMediaId?: string; containerId?: string; permalink?: string; errorMessage?: string }): Promise<void>;
    updateEngagement(id: string, engagement: Partial<Pick<InstagramMedia, 'likeCount' | 'commentsCount' | 'impressions' | 'reach' | 'engagement' | 'saves' | 'shares'>>): Promise<void>;
    delete(id: string, tenantId: string): Promise<void>;
}

export function createInstagramMediaRepo(pool: Pool): IInstagramMediaRepo {
    return {
        async findByTenant(tenantId, filters = {}) {
            const conditions = ['tenant_id = $1'];
            const values: any[] = [tenantId];
            let idx = 2;

            if (filters.status) {
                conditions.push(`status = $${idx}`);
                values.push(filters.status);
                idx++;
            }
            if (filters.mediaType) {
                conditions.push(`media_type = $${idx}`);
                values.push(filters.mediaType);
                idx++;
            }

            const where = conditions.join(' AND ');
            const limit = filters.limit || 50;
            const offset = filters.offset || 0;

            const [dataResult, countResult] = await Promise.all([
                pool.query<InstagramMediaRow>(
                    `SELECT * FROM instagram_media WHERE ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
                    [...values, limit, offset],
                ),
                pool.query<{ count: string }>(
                    `SELECT COUNT(*) as count FROM instagram_media WHERE ${where}`,
                    values,
                ),
            ]);

            return {
                items: dataResult.rows.map(mapRowToMedia),
                total: parseInt(countResult.rows[0].count, 10),
            };
        },

        async findById(id, tenantId) {
            const { rows } = await pool.query<InstagramMediaRow>(
                `SELECT * FROM instagram_media WHERE id = $1 AND tenant_id = $2`,
                [id, tenantId],
            );
            return rows[0] ? mapRowToMedia(rows[0]) : null;
        },

        async findByIgMediaId(igMediaId) {
            const { rows } = await pool.query<InstagramMediaRow>(
                `SELECT * FROM instagram_media WHERE ig_media_id = $1`,
                [igMediaId],
            );
            return rows[0] ? mapRowToMedia(rows[0]) : null;
        },

        async save(input) {
            const { rows } = await pool.query<InstagramMediaRow>(
                `INSERT INTO instagram_media
                    (tenant_id, account_id, media_type, caption, alt_text, media_url, scheduled_at, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 RETURNING *`,
                [
                    input.tenantId,
                    input.accountId,
                    input.mediaType,
                    input.caption || null,
                    input.altText || null,
                    input.mediaUrl,
                    input.scheduledAt || null,
                    input.scheduledAt ? 'scheduled' : 'pending',
                ],
            );
            return mapRowToMedia(rows[0]);
        },

        async updateStatus(id, status, extra = {}) {
            const setClauses = ['status = $1', 'updated_at = NOW()'];
            const values: any[] = [status];
            let idx = 2;

            if (extra.igMediaId) {
                setClauses.push(`ig_media_id = $${idx}`);
                values.push(extra.igMediaId);
                idx++;
            }
            if (extra.containerId) {
                setClauses.push(`container_id = $${idx}`);
                values.push(extra.containerId);
                idx++;
            }
            if (extra.permalink) {
                setClauses.push(`permalink = $${idx}`);
                values.push(extra.permalink);
                idx++;
            }
            if (extra.errorMessage !== undefined) {
                setClauses.push(`error_message = $${idx}`);
                values.push(extra.errorMessage);
                idx++;
            }
            if (status === 'published') {
                setClauses.push(`published_at = NOW()`);
            }

            values.push(id);
            await pool.query(
                `UPDATE instagram_media SET ${setClauses.join(', ')} WHERE id = $${idx}`,
                values,
            );
        },

        async updateEngagement(id, engagement) {
            const setClauses: string[] = [];
            const values: any[] = [];
            let idx = 1;

            const columnMap: Record<string, string> = {
                likeCount: 'like_count',
                commentsCount: 'comments_count',
                impressions: 'impressions',
                reach: 'reach',
                engagement: 'engagement',
                saves: 'saves',
                shares: 'shares',
            };

            for (const [key, column] of Object.entries(columnMap)) {
                if ((engagement as any)[key] !== undefined) {
                    setClauses.push(`${column} = $${idx}`);
                    values.push((engagement as any)[key]);
                    idx++;
                }
            }

            if (setClauses.length === 0) return;

            setClauses.push(`updated_at = NOW()`);
            values.push(id);

            await pool.query(
                `UPDATE instagram_media SET ${setClauses.join(', ')} WHERE id = $${idx}`,
                values,
            );
        },

        async delete(id, tenantId) {
            await pool.query(
                `DELETE FROM instagram_media WHERE id = $1 AND tenant_id = $2`,
                [id, tenantId],
            );
        },
    };
}
