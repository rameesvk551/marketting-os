import { QueryInterface, DataTypes } from 'sequelize';

export default {
    up: async (queryInterface: QueryInterface) => {
        await queryInterface.createTable('whatsapp_appointments', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            tenant_id: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            contact_name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            contact_phone: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            service_type: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            appointment_date: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            status: {
                type: DataTypes.STRING,
                defaultValue: 'SCHEDULED', // SCHEDULED, CANCELLED, COMPLETED
                allowNull: false,
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            updated_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },
        });

        await queryInterface.addIndex('whatsapp_appointments', ['tenant_id']);
        await queryInterface.addIndex('whatsapp_appointments', ['contact_phone']);
    },

    down: async (queryInterface: QueryInterface) => {
        await queryInterface.dropTable('whatsapp_appointments');
    },
};
