import { QueryInterface, DataTypes } from 'sequelize';

export default {
    up: async (queryInterface: QueryInterface) => {
        await queryInterface.createTable('instagram_automation_rules', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            tenant_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'tenants',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            account_id: {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: 'instagram_accounts',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            status: {
                type: DataTypes.ENUM('draft', 'active', 'paused'),
                defaultValue: 'draft',
            },
            trigger: {
                // { type: 'comment' | 'dm', scope: 'all' | 'specific', postId?: string, keywordFilterEnabled: boolean, keywords: string[] }
                type: DataTypes.JSONB,
                defaultValue: {},
            },
            optional_actions: {
                // { replyPublic: boolean, sendOpeningDm: boolean, requireFollow: boolean, collectEmail: boolean }
                type: DataTypes.JSONB,
                defaultValue: {},
            },
            actions: {
                // Array of actions: [{ type: 'send_dm', message: string, blocks: [], products: [] }]
                type: DataTypes.JSONB,
                defaultValue: [],
            },
            stats: {
                // { triggered: number, dms_sent: number, replies_sent: number }
                type: DataTypes.JSONB,
                defaultValue: { triggered: 0, dms_sent: 0, replies_sent: 0 },
            },
            created_at: {
                allowNull: false,
                type: DataTypes.DATE,
            },
            updated_at: {
                allowNull: false,
                type: DataTypes.DATE,
            },
        });

        // Add indexes for faster lookups
        await queryInterface.addIndex('instagram_automation_rules', ['tenant_id']);
        await queryInterface.addIndex('instagram_automation_rules', ['account_id']);
        await queryInterface.addIndex('instagram_automation_rules', ['status']);
    },

    down: async (queryInterface: QueryInterface) => {
        await queryInterface.dropTable('instagram_automation_rules');
    },
};
