import { QueryInterface, DataTypes, Sequelize } from 'sequelize';

export default {
    async up(queryInterface: QueryInterface) {
        await queryInterface.sequelize.query(`
        -- ── Instagram Comments ──
        CREATE TABLE IF NOT EXISTS instagram_comments (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            account_id      UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
            media_id        UUID NOT NULL REFERENCES instagram_media(id) ON DELETE CASCADE,
            ig_comment_id   VARCHAR(100) NOT NULL UNIQUE,
            ig_media_id     VARCHAR(100) NOT NULL,
            from_username   VARCHAR(200) NOT NULL,
            from_id         VARCHAR(100),
            text            TEXT NOT NULL,
            parent_id       VARCHAR(100), -- For replies
            is_hidden       BOOLEAN DEFAULT FALSE,
            like_count      INTEGER DEFAULT 0,
            timestamp       TIMESTAMPTZ NOT NULL,
            created_at      TIMESTAMPTZ DEFAULT NOW(),
            updated_at      TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_ig_comments_tenant ON instagram_comments(tenant_id);
        CREATE INDEX IF NOT EXISTS idx_ig_comments_account ON instagram_comments(account_id);
        CREATE INDEX IF NOT EXISTS idx_ig_comments_media ON instagram_comments(media_id);
        CREATE INDEX IF NOT EXISTS idx_ig_comments_timestamp ON instagram_comments(timestamp DESC);

        -- ── Instagram Messages (DMs) ──
        CREATE TABLE IF NOT EXISTS instagram_messages (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            account_id      UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
            ig_message_id   VARCHAR(100) NOT NULL UNIQUE,
            conversation_id VARCHAR(100), -- Meta doesn't always provide thread ID, sender/recipient used
            sender_id       VARCHAR(100) NOT NULL,
            recipient_id    VARCHAR(100) NOT NULL,
            text            TEXT,
            attachments     JSONB, -- E.g. [{ type: 'image', payload: { url: '...' } }]
            is_echo         BOOLEAN DEFAULT FALSE, -- True if sent by the business
            is_deleted      BOOLEAN DEFAULT FALSE,
            timestamp       TIMESTAMPTZ NOT NULL,
            created_at      TIMESTAMPTZ DEFAULT NOW(),
            updated_at      TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_ig_messages_tenant ON instagram_messages(tenant_id);
        CREATE INDEX IF NOT EXISTS idx_ig_messages_account ON instagram_messages(account_id);
        CREATE INDEX IF NOT EXISTS idx_ig_messages_sender ON instagram_messages(sender_id);
        CREATE INDEX IF NOT EXISTS idx_ig_messages_timestamp ON instagram_messages(timestamp DESC);
    `);
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.sequelize.query(`
        DROP TABLE IF EXISTS instagram_messages CASCADE;
        DROP TABLE IF EXISTS instagram_comments CASCADE;
    `);
    }
};
