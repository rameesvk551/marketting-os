// models/CatalogSyncLog.ts
// Domain model for catalog sync history entries.

export interface CatalogSyncLog {
    id: string;
    tenantId: string;
    catalogId: string;
    syncType: 'full' | 'incremental' | 'single';
    status: 'pending' | 'running' | 'completed' | 'failed';
    totalProducts: number;
    syncedCount: number;
    failedCount: number;
    errors: any[];
    startedAt: Date;
    completedAt: Date | null;
    createdAt: Date;
}

export interface CreateSyncLogInput {
    tenantId: string;
    catalogId: string;
    syncType: CatalogSyncLog['syncType'];
    totalProducts?: number;
}

export interface CatalogSyncLogRow {
    id: string;
    tenant_id: string;
    catalog_id: string;
    sync_type: string;
    status: string;
    total_products: number;
    synced_count: number;
    failed_count: number;
    errors: any;
    started_at: string;
    completed_at: string | null;
    created_at: string;
}

export function mapRowToSyncLog(row: CatalogSyncLogRow): CatalogSyncLog {
    return {
        id: row.id,
        tenantId: row.tenant_id,
        catalogId: row.catalog_id,
        syncType: row.sync_type as CatalogSyncLog['syncType'],
        status: row.status as CatalogSyncLog['status'],
        totalProducts: row.total_products,
        syncedCount: row.synced_count,
        failedCount: row.failed_count,
        errors: Array.isArray(row.errors) ? row.errors : [],
        startedAt: new Date(row.started_at),
        completedAt: row.completed_at ? new Date(row.completed_at) : null,
        createdAt: new Date(row.created_at),
    };
}
