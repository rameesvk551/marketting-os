import { QueryInterface, DataTypes, Sequelize } from 'sequelize';

export default {
    async up(queryInterface: QueryInterface) {
        await queryInterface.createTable('whatsapp_opt_ins', {
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
            phone_number: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            status: {
                type: DataTypes.STRING,
                defaultValue: 'pending',
            },
            opt_in_date: {
                type: DataTypes.DATE,
                allowNull: true,
            },
        });
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.dropTable('whatsapp_opt_ins');
    },
};
