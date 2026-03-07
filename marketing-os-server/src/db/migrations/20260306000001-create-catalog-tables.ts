import { QueryInterface, DataTypes, Sequelize } from 'sequelize';

export default {
    async up(queryInterface: QueryInterface) {
        await queryInterface.sequelize.query(`
        -- ── Catalog Configs — stores per-tenant Meta Catalog connection ──
        CREATE TABLE IF NOT EXISTS catalog_configs (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id       VARCHAR(100) NOT NULL,
            catalog_id      VARCHAR(100) NOT NULL,
            business_id     VARCHAR(100) NOT NULL,
            catalog_name    VARCHAR(255) NOT NULL DEFAULT '',
            access_token    TEXT NOT NULL,
            token_expires_at TIMESTAMPTZ,
            auto_sync_enabled BOOLEAN NOT NULL DEFAULT true,
            last_sync_at    TIMESTAMPTZ,
            status          VARCHAR(30) NOT NULL DEFAULT 'active',
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            CONSTRAINT uq_catalog_configs_tenant UNIQUE (tenant_id, catalog_id)
        );

        CREATE INDEX IF NOT EXISTS idx_catalog_configs_tenant
            ON catalog_configs (tenant_id);

        -- ── Catalog Sync Logs — tracks every sync attempt ──
        CREATE TABLE IF NOT EXISTS catalog_sync_logs (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id       VARCHAR(100) NOT NULL,
            catalog_id      VARCHAR(100) NOT NULL,
            sync_type       VARCHAR(30) NOT NULL DEFAULT 'full',
            status          VARCHAR(30) NOT NULL DEFAULT 'pending',
            total_products  INTEGER NOT NULL DEFAULT 0,
            synced_count    INTEGER NOT NULL DEFAULT 0,
            failed_count    INTEGER NOT NULL DEFAULT 0,
            errors          JSONB DEFAULT '[]'::jsonb,
            started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            completed_at    TIMESTAMPTZ,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_catalog_sync_logs_tenant
            ON catalog_sync_logs (tenant_id, catalog_id);
        CREATE INDEX IF NOT EXISTS idx_catalog_sync_logs_status
            ON catalog_sync_logs (status);
    `);
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.sequelize.query(`
        DROP TABLE IF EXISTS catalog_sync_logs;
        DROP TABLE IF EXISTS catalog_configs;
    `);
    }
};
