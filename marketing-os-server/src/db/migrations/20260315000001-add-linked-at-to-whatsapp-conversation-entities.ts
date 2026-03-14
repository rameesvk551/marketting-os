import { QueryInterface, DataTypes } from 'sequelize';

export default {
    async up(queryInterface: QueryInterface) {
        await queryInterface.addColumn('whatsapp_conversation_entities', 'linked_at', {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        });
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.removeColumn('whatsapp_conversation_entities', 'linked_at');
    },
};
