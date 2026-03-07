import { QueryInterface, DataTypes } from 'sequelize';

export default {
    async up(queryInterface: QueryInterface) {
        await queryInterface.addColumn('whatsapp_business_configs', 'instagram_account_id', {
            type: DataTypes.STRING,
            allowNull: true,
        });
        await queryInterface.addColumn('whatsapp_business_configs', 'catalog_id', {
            type: DataTypes.STRING,
            allowNull: true,
        });
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.removeColumn('whatsapp_business_configs', 'instagram_account_id');
        await queryInterface.removeColumn('whatsapp_business_configs', 'catalog_id');
    },
};
