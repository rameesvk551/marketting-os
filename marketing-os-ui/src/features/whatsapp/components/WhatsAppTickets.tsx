import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Tag, Button, Space, message, Modal, Avatar } from 'antd';
import { CheckCircleOutlined, UserOutlined, ClockCircleOutlined } from '@ant-design/icons';
import client from '../../../api/client';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text } = Typography;

interface Ticket {
    id: string;
    externalId: string;
    primaryActor: {
        displayName: string;
        phoneNumber: string;
    };
    providerMetadata: {
        escalationReason?: string;
        escalatedAt?: string;
    };
    isEscalated: boolean;
    state: string;
    agentId?: string;
}

const WhatsAppTickets: React.FC = () => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const response = await client.get('/whatsapp/tickets');
            setTickets(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch tickets:', error);
            message.error('Failed to load tickets');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const handleResolve = async (ticket: Ticket) => {
        Modal.confirm({
            title: 'Resolve Ticket?',
            content: `Are you sure you want to resolve the ticket for ${ticket.primaryActor.displayName}? The AI will resume taking over the conversation.`,
            okText: 'Resolve',
            okButtonProps: { danger: false, type: 'primary' },
            onOk: async () => {
                try {
                    await client.post(`/whatsapp/tickets/${ticket.id}/resolve`);
                    message.success('Ticket marked as resolved');
                    fetchTickets();
                } catch (error) {
                    message.error('Failed to resolve ticket');
                }
            }
        });
    };

    const columns = [
        {
            title: 'Customer',
            key: 'customer',
            render: (_: any, record: Ticket) => (
                <Space>
                    <Avatar icon={<UserOutlined />} src={`https://api.dicebear.com/7.x/initials/svg?seed=${record.primaryActor.displayName}`} />
                    <div>
                        <div style={{ fontWeight: 500 }}>{record.primaryActor.displayName}</div>
                        <Text type="secondary" style={{ fontSize: 12 }}>{record.primaryActor.phoneNumber}</Text>
                    </div>
                </Space>
            )
        },
        {
            title: 'Escalation Reason',
            key: 'reason',
            render: (_: any, record: Ticket) => (
                <Text>{record.providerMetadata?.escalationReason || 'Automation Rule (Assign Agent)'}</Text>
            )
        },
        {
            title: 'Time Escalate',
            key: 'time',
            render: (_: any, record: Ticket) => (
                <Space>
                    <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
                    <Text type="secondary">
                        {record.providerMetadata?.escalatedAt ? dayjs(record.providerMetadata.escalatedAt).fromNow() : 'Unknown'}
                    </Text>
                </Space>
            )
        },
        {
            title: 'Status',
            key: 'status',
            render: (_: any, record: Ticket) => (
                <Tag color={record.isEscalated ? 'error' : 'success'}>
                    {record.isEscalated ? 'ESCALATED' : record.state}
                </Tag>
            )
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: Ticket) => (
                <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleResolve(record)}
                    size="small"
                >
                    Resolve
                </Button>
            )
        }
    ];

    return (
        <Card title="Helpdesk Tickets (Escalations)" className="tickets-card">
            <Typography.Paragraph type="secondary">
                Conversations that have been escalated to a human agent, either by an Automation Rule or by an explicit AI handoff, will appear here. Resolving a ticket passes control back to the AI assistant.
            </Typography.Paragraph>
            <Table
                dataSource={tickets}
                columns={columns}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />
        </Card>
    );
};

export default WhatsAppTickets;
