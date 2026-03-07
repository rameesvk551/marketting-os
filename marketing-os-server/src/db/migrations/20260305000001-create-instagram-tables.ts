import { QueryInterface, DataTypes, Sequelize } from 'sequelize';

export default {
    async up(queryInterface: QueryInterface) {
        await queryInterface.sequelize.query(`
        -- ── Instagram Accounts ──
        CREATE TABLE IF NOT EXISTS instagram_accounts (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            ig_user_id      VARCHAR(100) NOT NULL,
            username        VARCHAR(200),
            name            VARCHAR(300),
            profile_picture_url TEXT,
            biography       TEXT,
            followers_count INTEGER DEFAULT 0,
            follows_count   INTEGER DEFAULT 0,
            media_count     INTEGER DEFAULT 0,
            account_type    VARCHAR(50) DEFAULT 'BUSINESS',
            access_token    TEXT NOT NULL,
            token_expires_at TIMESTAMPTZ,
            page_id         VARCHAR(100),
            status          VARCHAR(30) DEFAULT 'active',
            connected_at    TIMESTAMPTZ DEFAULT NOW(),
            last_synced_at  TIMESTAMPTZ,
            created_at      TIMESTAMPTZ DEFAULT NOW(),
            updated_at      TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(tenant_id, ig_user_id)
        );

        CREATE INDEX IF NOT EXISTS idx_ig_accounts_tenant ON instagram_accounts(tenant_id);
        CREATE INDEX IF NOT EXISTS idx_ig_accounts_status ON instagram_accounts(status);

        -- ── Instagram Media ──
        CREATE TABLE IF NOT EXISTS instagram_media (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            account_id      UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
            ig_media_id     VARCHAR(100),
            container_id    VARCHAR(100),
            media_type      VARCHAR(30) NOT NULL DEFAULT 'IMAGE',
            caption         TEXT,
            alt_text        TEXT,
            media_url       TEXT,
            thumbnail_url   TEXT,
            permalink       VARCHAR(500),
            status          VARCHAR(30) DEFAULT 'pending',
            like_count      INTEGER DEFAULT 0,
            comments_count  INTEGER DEFAULT 0,
            impressions     INTEGER DEFAULT 0,
            reach           INTEGER DEFAULT 0,
            engagement      INTEGER DEFAULT 0,
            saves           INTEGER DEFAULT 0,
            shares          INTEGER DEFAULT 0,
            published_at    TIMESTAMPTZ,
            scheduled_at    TIMESTAMPTZ,
            error_message   TEXT,
            created_at      TIMESTAMPTZ DEFAULT NOW(),
            updated_at      TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_ig_media_tenant ON instagram_media(tenant_id);
        CREATE INDEX IF NOT EXISTS idx_ig_media_account ON instagram_media(account_id);
        CREATE INDEX IF NOT EXISTS idx_ig_media_status ON instagram_media(status);
        CREATE INDEX IF NOT EXISTS idx_ig_media_type ON instagram_media(media_type);
        CREATE INDEX IF NOT EXISTS idx_ig_media_published ON instagram_media(published_at DESC);
    `);
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.sequelize.query(`
        DROP TABLE IF EXISTS instagram_media CASCADE;
        DROP TABLE IF EXISTS instagram_accounts CASCADE;
    `);
    }
};
