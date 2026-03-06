// models/CatalogConfig.ts
// Domain model for Meta Catalog connection config per tenant.

export interface CatalogConfig {
    id: string;
    tenantId: string;
    catalogId: string;
    businessId: string;
    catalogName: string;
    accessToken: string;
    tokenExpiresAt: Date | null;
    autoSyncEnabled: boolean;
    lastSyncAt: Date | null;
    status: 'active' | 'disconnected' | 'error';
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateCatalogConfigInput {
    tenantId: string;
    catalogId: string;
    businessId: string;
    catalogName?: string;
    accessToken: string;
    tokenExpiresAt?: Date;
    autoSyncEnabled?: boolean;
}

export interface CatalogConfigRow {
    id: string;
    tenant_id: string;
    catalog_id: string;
    business_id: string;
    catalog_name: string;
    access_token: string;
    token_expires_at: string | null;
    auto_sync_enabled: boolean;
    last_sync_at: string | null;
    status: string;
    created_at: string;
    updated_at: string;
}

export function mapRowToConfig(row: CatalogConfigRow): CatalogConfig {
    return {
        id: row.id,
        tenantId: row.tenant_id,
        catalogId: row.catalog_id,
        businessId: row.business_id,
        catalogName: row.catalog_name,
        accessToken: row.access_token,
        tokenExpiresAt: row.token_expires_at ? new Date(row.token_expires_at) : null,
        autoSyncEnabled: row.auto_sync_enabled,
        lastSyncAt: row.last_sync_at ? new Date(row.last_sync_at) : null,
        status: row.status as CatalogConfig['status'],
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
}
