import { QueryInterface, DataTypes, Sequelize } from 'sequelize';

export default {
    async up(queryInterface: QueryInterface) {
        await queryInterface.createTable('tenants', {
            id: {
                type: DataTypes.UUID,
                defaultValue: Sequelize.literal('gen_random_uuid()'),
                primaryKey: true,
                allowNull: false,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            slug: {
                type: DataTypes.STRING(100),
                allowNull: false,
                unique: true,
            },
            location: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
            settings: {
                type: DataTypes.JSONB,
                allowNull: true,
                defaultValue: {},
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
        await queryInterface.dropTable('tenants');
    },
};
