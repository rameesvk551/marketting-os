import { QueryInterface, DataTypes } from 'sequelize';

export default {
    up: async (queryInterface: QueryInterface) => {
        await queryInterface.createTable('whatsapp_automation_rules', {
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
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
            trigger: {
                type: DataTypes.JSONB,
                defaultValue: {},
            },
            conditions: {
                type: DataTypes.JSONB,
                defaultValue: [],
            },
            actions: {
                type: DataTypes.JSONB,
                defaultValue: [],
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

        // Add index on tenant_id for faster lookups
        await queryInterface.addIndex('whatsapp_automation_rules', ['tenant_id']);
    },

    down: async (queryInterface: QueryInterface) => {
        await queryInterface.dropTable('whatsapp_automation_rules');
    },
};
