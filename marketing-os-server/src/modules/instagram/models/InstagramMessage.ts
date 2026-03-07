// models/InstagramMessage.ts
// Domain model for Instagram Direct Messages.

export interface InstagramMessage {
    id: string;
    tenantId: string;
    accountId: string;
    igMessageId: string;
    conversationId: string | null;
    senderId: string;
    recipientId: string;
    text: string | null;
    attachments: any | null;
    isEcho: boolean;
    isDeleted: boolean;
    timestamp: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateInstagramMessageInput {
    tenantId: string;
    accountId: string;
    igMessageId: string;
    conversationId?: string;
    senderId: string;
    recipientId: string;
    text?: string;
    attachments?: any;
    isEcho?: boolean;
    isDeleted?: boolean;
    timestamp: Date;
}

export interface InstagramMessageRow {
    id: string;
    tenant_id: string;
    account_id: string;
    ig_message_id: string;
    conversation_id: string | null;
    sender_id: string;
    recipient_id: string;
    text: string | null;
    attachments: any | null;
    is_echo: boolean;
    is_deleted: boolean;
    timestamp: string;
    created_at: string;
    updated_at: string;
}

export function mapRowToInstagramMessage(row: InstagramMessageRow): InstagramMessage {
    return {
        id: row.id,
        tenantId: row.tenant_id,
        accountId: row.account_id,
        igMessageId: row.ig_message_id,
        conversationId: row.conversation_id,
        senderId: row.sender_id,
        recipientId: row.recipient_id,
        text: row.text,
        attachments: row.attachments,
        isEcho: row.is_echo,
        isDeleted: row.is_deleted,
        timestamp: new Date(row.timestamp),
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
}
