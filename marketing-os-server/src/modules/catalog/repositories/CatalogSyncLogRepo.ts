// repositories/CatalogSyncLogRepo.ts
// CRUD operations for catalog_sync_logs table.

import { Pool } from 'pg';
import {
    CatalogSyncLog,
    CatalogSyncLogRow,
    CreateSyncLogInput,
    mapRowToSyncLog,
} from '../models/CatalogSyncLog.js';

export interface ICatalogSyncLogRepo {
    create(input: CreateSyncLogInput): Promise<CatalogSyncLog>;
    update(id: string, updates: Partial<Pick<CatalogSyncLog, 'status' | 'syncedCount' | 'failedCount' | 'errors' | 'completedAt' | 'totalProducts'>>): Promise<void>;
    findByTenant(tenantId: string, limit?: number): Promise<CatalogSyncLog[]>;
    findLatest(tenantId: string, catalogId: string): Promise<CatalogSyncLog | null>;
    findById(id: string): Promise<CatalogSyncLog | null>;
}

export function createCatalogSyncLogRepo(pool: Pool): ICatalogSyncLogRepo {
    return {
        async create(input: CreateSyncLogInput): Promise<CatalogSyncLog> {
            const { rows } = await pool.query<CatalogSyncLogRow>(
                `INSERT INTO catalog_sync_logs
                    (tenant_id, catalog_id, sync_type, total_products, status)
                 VALUES ($1, $2, $3, $4, 'running')
                 RETURNING *`,
                [
                    input.tenantId,
                    input.catalogId,
                    input.syncType,
                    input.totalProducts || 0,
                ],
            );
            return mapRowToSyncLog(rows[0]);
        },

        async update(id: string, updates: Record<string, any>): Promise<void> {
            const setClauses: string[] = [];
            const values: any[] = [];
            let idx = 1;

            const columnMap: Record<string, string> = {
                status: 'status',
                syncedCount: 'synced_count',
                failedCount: 'failed_count',
                errors: 'errors',
                completedAt: 'completed_at',
                totalProducts: 'total_products',
            };

            for (const [key, column] of Object.entries(columnMap)) {
                if (updates[key] !== undefined) {
                    const val = key === 'errors' ? JSON.stringify(updates[key]) : updates[key];
                    setClauses.push(`${column} = $${idx}`);
                    values.push(val);
                    idx++;
                }
            }

            if (setClauses.length === 0) return;
            values.push(id);

            await pool.query(
                `UPDATE catalog_sync_logs SET ${setClauses.join(', ')} WHERE id = $${idx}`,
                values,
            );
        },

        async findByTenant(tenantId: string, limit = 20): Promise<CatalogSyncLog[]> {
            const { rows } = await pool.query<CatalogSyncLogRow>(
                `SELECT * FROM catalog_sync_logs WHERE tenant_id = $1 ORDER BY started_at DESC LIMIT $2`,
                [tenantId, limit],
            );
            return rows.map(mapRowToSyncLog);
        },

        async findLatest(tenantId: string, catalogId: string): Promise<CatalogSyncLog | null> {
            const { rows } = await pool.query<CatalogSyncLogRow>(
                `SELECT * FROM catalog_sync_logs WHERE tenant_id = $1 AND catalog_id = $2 ORDER BY started_at DESC LIMIT 1`,
                [tenantId, catalogId],
            );
            return rows[0] ? mapRowToSyncLog(rows[0]) : null;
        },

        async findById(id: string): Promise<CatalogSyncLog | null> {
            const { rows } = await pool.query<CatalogSyncLogRow>(
                `SELECT * FROM catalog_sync_logs WHERE id = $1`,
                [id],
            );
            return rows[0] ? mapRowToSyncLog(rows[0]) : null;
        },
    };
}
