import { QueryInterface, DataTypes, Sequelize } from 'sequelize';

export default {
    async up(queryInterface: QueryInterface) {
        await queryInterface.createTable('whatsapp_templates', {
            id: {
                type: DataTypes.UUID,
                defaultValue: Sequelize.literal('gen_random_uuid()'),
                primaryKey: true,
                allowNull: false,
            },
            tenant_id: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            template_name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            category: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            use_case: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            body_content: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            status: {
                type: DataTypes.STRING,
                defaultValue: 'draft',
            },
            language: {
                type: DataTypes.STRING(10),
                defaultValue: 'en',
            },
            header_type: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            header_content: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            footer_content: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            components: {
                type: DataTypes.JSONB,
                allowNull: true,
            },
            variables: {
                type: DataTypes.JSONB,
                allowNull: true,
            },
            trigger_events: {
                type: DataTypes.JSONB,
                allowNull: true,
            },
            required_role: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            submitted_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            approved_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            rejected_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            rejection_reason: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            created_by: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('NOW()'),
            },
            updated_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('NOW()'),
            },
        });
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.dropTable('whatsapp_templates');
    },
};
