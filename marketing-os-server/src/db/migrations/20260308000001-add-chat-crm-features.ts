import { QueryInterface, DataTypes } from 'sequelize';

export default {
    up: async (queryInterface: QueryInterface) => {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            await queryInterface.addColumn('whatsapp_conversations', 'agent_id', {
                type: DataTypes.UUID,
                allowNull: true,
            }, { transaction });

            await queryInterface.addColumn('whatsapp_conversations', 'tags', {
                type: DataTypes.JSONB,
                allowNull: false,
                defaultValue: [],
            }, { transaction });

            await queryInterface.addColumn('whatsapp_conversations', 'notes', {
                type: DataTypes.JSONB,
                allowNull: false,
                defaultValue: [],
            }, { transaction });

            await queryInterface.addColumn('whatsapp_business_configs', 'auto_greeting_message', {
                type: DataTypes.TEXT,
                allowNull: true,
            }, { transaction });

            await queryInterface.addColumn('whatsapp_business_configs', 'away_message', {
                type: DataTypes.TEXT,
                allowNull: true,
            }, { transaction });

            await queryInterface.addColumn('whatsapp_business_configs', 'business_hours', {
                type: DataTypes.JSONB,
                allowNull: true,
            }, { transaction });

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    },

    down: async (queryInterface: QueryInterface) => {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            await queryInterface.removeColumn('whatsapp_conversations', 'agent_id', { transaction });
            await queryInterface.removeColumn('whatsapp_conversations', 'tags', { transaction });
            await queryInterface.removeColumn('whatsapp_conversations', 'notes', { transaction });
            await queryInterface.removeColumn('whatsapp_business_configs', 'auto_greeting_message', { transaction });
            await queryInterface.removeColumn('whatsapp_business_configs', 'away_message', { transaction });
            await queryInterface.removeColumn('whatsapp_business_configs', 'business_hours', { transaction });
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
};
