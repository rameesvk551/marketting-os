import { QueryInterface, DataTypes } from 'sequelize';

export default {
    up: async (queryInterface: QueryInterface) => {
        await queryInterface.addColumn('users', 'metaAccessToken', {
            type: DataTypes.STRING,
            allowNull: true,
        });
        await queryInterface.addColumn('users', 'metaBusinessId', {
            type: DataTypes.STRING,
            allowNull: true,
        });
        await queryInterface.addColumn('users', 'metaWabaId', {
            type: DataTypes.STRING,
            allowNull: true,
        });
        await queryInterface.addColumn('users', 'metaPhoneNumberId', {
            type: DataTypes.STRING,
            allowNull: true,
        });
    },

    down: async (queryInterface: QueryInterface) => {
        await queryInterface.removeColumn('users', 'metaAccessToken');
        await queryInterface.removeColumn('users', 'metaBusinessId');
        await queryInterface.removeColumn('users', 'metaWabaId');
        await queryInterface.removeColumn('users', 'metaPhoneNumberId');
    },
};
