// repositories/InstagramMessageRepo.ts
// CRUD operations for Instagram Direct Messages.

import { Pool } from 'pg';
import {
    InstagramMessage,
    InstagramMessageRow,
    CreateInstagramMessageInput,
    mapRowToInstagramMessage,
} from '../models/InstagramMessage.js';

export interface IInstagramMessageRepo {
    findByTenant(tenantId: string, limit?: number, offset?: number): Promise<InstagramMessage[]>;
    findByConversation(tenantId: string, conversationId: string, limit?: number): Promise<InstagramMessage[]>;
    save(input: CreateInstagramMessageInput): Promise<InstagramMessage>;
    markDeleted(id: string, tenantId: string): Promise<void>;
}

export function createInstagramMessageRepo(pool: Pool): IInstagramMessageRepo {
    return {
        async findByTenant(tenantId: string, limit = 50, offset = 0): Promise<InstagramMessage[]> {
            const { rows } = await pool.query<InstagramMessageRow>(
                `SELECT * FROM instagram_messages 
                 WHERE tenant_id = $1 AND is_deleted = false
                 ORDER BY timestamp DESC
                 LIMIT $2 OFFSET $3`,
                [tenantId, limit, offset],
            );
            return rows.map(mapRowToInstagramMessage);
        },

        async findByConversation(tenantId: string, conversationId: string, limit = 100): Promise<InstagramMessage[]> {
            const { rows } = await pool.query<InstagramMessageRow>(
                `SELECT * FROM instagram_messages 
                 WHERE tenant_id = $1 AND conversation_id = $2 AND is_deleted = false
                 ORDER BY timestamp ASC
                 LIMIT $3`,
                [tenantId, conversationId, limit],
            );
            return rows.map(mapRowToInstagramMessage);
        },

        async save(input: CreateInstagramMessageInput): Promise<InstagramMessage> {
            const { rows } = await pool.query<InstagramMessageRow>(
                `INSERT INTO instagram_messages
                    (tenant_id, account_id, ig_message_id, conversation_id, sender_id, recipient_id, 
                     text, attachments, is_echo, is_deleted, timestamp)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                 ON CONFLICT (ig_message_id) 
                 DO UPDATE SET
                    text = EXCLUDED.text,
                    attachments = EXCLUDED.attachments,
                    is_deleted = EXCLUDED.is_deleted,
                    updated_at = NOW()
                 RETURNING *`,
                [
                    input.tenantId,
                    input.accountId,
                    input.igMessageId,
                    input.conversationId || null,
                    input.senderId,
                    input.recipientId,
                    input.text || null,
                    input.attachments || null,
                    input.isEcho || false,
                    input.isDeleted || false,
                    input.timestamp,
                ],
            );
            return mapRowToInstagramMessage(rows[0]);
        },

        async markDeleted(id: string, tenantId: string): Promise<void> {
            await pool.query(
                `UPDATE instagram_messages SET is_deleted = true, updated_at = NOW() 
                 WHERE id = $1 AND tenant_id = $2`,
                [id, tenantId],
            );
        },
    };
}
