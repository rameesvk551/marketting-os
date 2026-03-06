import { QueryInterface, DataTypes, Sequelize } from 'sequelize';

export default {
    async up(queryInterface: QueryInterface) {
        // Add all missing columns to whatsapp_messages table
        // The original migration only created: id, tenant_id, conversation_id, direction, message_type, status, linked_lead_id, linked_booking_id
        // The model and repository expect many more columns

        const columnsToAdd: Record<string, any> = {
            provider_message_id: { type: DataTypes.STRING, allowNull: true },
            provider_timestamp: { type: DataTypes.DATE, allowNull: true },
            sender_phone: { type: DataTypes.STRING, allowNull: true },
            recipient_phone: { type: DataTypes.STRING, allowNull: true },
            text_content: { type: DataTypes.JSONB, allowNull: true },
            media_content: { type: DataTypes.JSONB, allowNull: true },
            location_content: { type: DataTypes.JSONB, allowNull: true },
            contact_content: { type: DataTypes.JSONB, allowNull: true },
            interactive_content: { type: DataTypes.JSONB, allowNull: true },
            template_content: { type: DataTypes.JSONB, allowNull: true },
            reply_to_message_id: { type: DataTypes.STRING, allowNull: true },
            selected_button_id: { type: DataTypes.STRING, allowNull: true },
            selected_list_item_id: { type: DataTypes.STRING, allowNull: true },
            status_timestamps: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
            failure_reason: { type: DataTypes.TEXT, allowNull: true },
            linked_trip_id: { type: DataTypes.UUID, allowNull: true },
            handled_by_user_id: { type: DataTypes.UUID, allowNull: true },
            is_processed: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
            processing_error: { type: DataTypes.TEXT, allowNull: true },
            requires_response: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
            idempotency_key: { type: DataTypes.STRING, allowNull: true, unique: true },
            created_at: { type: DataTypes.DATE, allowNull: true, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: DataTypes.DATE, allowNull: true, defaultValue: Sequelize.literal('NOW()') },
        };

        for (const [columnName, columnDef] of Object.entries(columnsToAdd)) {
            try {
                await queryInterface.addColumn('whatsapp_messages', columnName, columnDef);
            } catch (err: any) {
                // Skip if column already exists
                if (err.message && err.message.includes('already exists')) {
                    console.log(`Column ${columnName} already exists, skipping`);
                } else {
                    throw err;
                }
            }
        }
    },

    async down(queryInterface: QueryInterface) {
        const columnsToRemove = [
            'provider_message_id', 'provider_timestamp', 'sender_phone', 'recipient_phone',
            'text_content', 'media_content', 'location_content', 'contact_content',
            'interactive_content', 'template_content', 'reply_to_message_id',
            'selected_button_id', 'selected_list_item_id', 'status_timestamps',
            'failure_reason', 'linked_trip_id', 'handled_by_user_id',
            'is_processed', 'processing_error', 'requires_response', 'idempotency_key',
            'created_at', 'updated_at',
        ];

        for (const col of columnsToRemove) {
            try {
                await queryInterface.removeColumn('whatsapp_messages', col);
            } catch {
                // ignore
            }
        }
    },
};
