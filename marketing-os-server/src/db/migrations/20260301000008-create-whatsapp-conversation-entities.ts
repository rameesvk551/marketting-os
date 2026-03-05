import { QueryInterface, DataTypes, Sequelize } from 'sequelize';

export default {
    async up(queryInterface: QueryInterface) {
        await queryInterface.createTable('whatsapp_conversation_entities', {
            id: {
                type: DataTypes.UUID,
                defaultValue: Sequelize.literal('gen_random_uuid()'),
                primaryKey: true,
                allowNull: false,
            },
            conversation_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'whatsapp_conversations',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
            entity_type: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            entity_id: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            is_primary: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
        });
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.dropTable('whatsapp_conversation_entities');
    },
};
