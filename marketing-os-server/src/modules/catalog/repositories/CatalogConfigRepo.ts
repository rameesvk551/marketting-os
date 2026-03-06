// repositories/CatalogConfigRepo.ts
// CRUD operations for catalog_configs table.

import { Pool } from 'pg';
import {
    CatalogConfig,
    CatalogConfigRow,
    CreateCatalogConfigInput,
    mapRowToConfig,
} from '../models/CatalogConfig.js';

export interface ICatalogConfigRepo {
    findByTenant(tenantId: string): Promise<CatalogConfig[]>;
    findById(id: string, tenantId: string): Promise<CatalogConfig | null>;
    findByCatalogId(catalogId: string, tenantId: string): Promise<CatalogConfig | null>;
    save(input: CreateCatalogConfigInput): Promise<CatalogConfig>;
    update(id: string, updates: Partial<Pick<CatalogConfig, 'catalogName' | 'accessToken' | 'tokenExpiresAt' | 'autoSyncEnabled' | 'lastSyncAt' | 'status'>>): Promise<void>;
    delete(id: string, tenantId: string): Promise<void>;
}

export function createCatalogConfigRepo(pool: Pool): ICatalogConfigRepo {
    return {
        async findByTenant(tenantId: string): Promise<CatalogConfig[]> {
            const { rows } = await pool.query<CatalogConfigRow>(
                `SELECT * FROM catalog_configs WHERE tenant_id = $1 ORDER BY created_at DESC`,
                [tenantId],
            );
            return rows.map(mapRowToConfig);
        },

        async findById(id: string, tenantId: string): Promise<CatalogConfig | null> {
            const { rows } = await pool.query<CatalogConfigRow>(
                `SELECT * FROM catalog_configs WHERE id = $1 AND tenant_id = $2`,
                [id, tenantId],
            );
            return rows[0] ? mapRowToConfig(rows[0]) : null;
        },

        async findByCatalogId(catalogId: string, tenantId: string): Promise<CatalogConfig | null> {
            const { rows } = await pool.query<CatalogConfigRow>(
                `SELECT * FROM catalog_configs WHERE catalog_id = $1 AND tenant_id = $2`,
                [catalogId, tenantId],
            );
            return rows[0] ? mapRowToConfig(rows[0]) : null;
        },

        async save(input: CreateCatalogConfigInput): Promise<CatalogConfig> {
            const { rows } = await pool.query<CatalogConfigRow>(
                `INSERT INTO catalog_configs
                    (tenant_id, catalog_id, business_id, catalog_name, access_token,
                     token_expires_at, auto_sync_enabled)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 ON CONFLICT (tenant_id, catalog_id)
                 DO UPDATE SET
                    business_id = EXCLUDED.business_id,
                    catalog_name = EXCLUDED.catalog_name,
                    access_token = EXCLUDED.access_token,
                    token_expires_at = EXCLUDED.token_expires_at,
                    auto_sync_enabled = EXCLUDED.auto_sync_enabled,
                    status = 'active',
                    updated_at = NOW()
                 RETURNING *`,
                [
                    input.tenantId,
                    input.catalogId,
                    input.businessId,
                    input.catalogName || '',
                    input.accessToken,
                    input.tokenExpiresAt || null,
                    input.autoSyncEnabled ?? true,
                ],
            );
            return mapRowToConfig(rows[0]);
        },

        async update(id: string, updates: Record<string, any>): Promise<void> {
            const setClauses: string[] = [];
            const values: any[] = [];
            let idx = 1;

            const columnMap: Record<string, string> = {
                catalogName: 'catalog_name',
                accessToken: 'access_token',
                tokenExpiresAt: 'token_expires_at',
                autoSyncEnabled: 'auto_sync_enabled',
                lastSyncAt: 'last_sync_at',
                status: 'status',
            };

            for (const [key, column] of Object.entries(columnMap)) {
                if (updates[key] !== undefined) {
                    setClauses.push(`${column} = $${idx}`);
                    values.push(updates[key]);
                    idx++;
                }
            }

            if (setClauses.length === 0) return;

            setClauses.push(`updated_at = NOW()`);
            values.push(id);

            await pool.query(
                `UPDATE catalog_configs SET ${setClauses.join(', ')} WHERE id = $${idx}`,
                values,
            );
        },

        async delete(id: string, tenantId: string): Promise<void> {
            await pool.query(
                `DELETE FROM catalog_configs WHERE id = $1 AND tenant_id = $2`,
                [id, tenantId],
            );
        },
    };
}
