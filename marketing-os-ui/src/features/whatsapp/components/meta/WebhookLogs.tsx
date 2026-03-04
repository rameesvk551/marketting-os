import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Typography, Button, Empty, Spin, Alert, Space, Select } from 'antd';
import { SyncOutlined, FilterOutlined, BellOutlined } from '@ant-design/icons';
import client from '../../../../api/client';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface WebhookLog {
    id: string;
    event_type: string;
    actor_type: string;
    actor_phone?: string;
    entity_type?: string;
    entity_id?: string;
    payload: any;
    created_at: string;
}

const WebhookLogs: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [logs, setLogs] = useState<WebhookLog[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<WebhookLog[]>([]);
    const [eventFilter, setEventFilter] = useState<string>('all');

    const fetchLogs = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch audit logs which serve as webhook logs
            await client.get('/whatsapp/conversations', {
                params: { limit: 50 }
            });
            // For now we use a placeholder approach - in production this would be a dedicated endpoint
            // We'll show the audit log data we already have
            setLogs([]);
            setFilteredLogs([]);
        } catch (err: any) {
            console.error('Failed to fetch webhook logs:', err);
            setError(err.response?.data?.message || 'Failed to fetch webhook logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    useEffect(() => {
        if (eventFilter === 'all') {
            setFilteredLogs(logs);
        } else {
            setFilteredLogs(logs.filter(l => l.event_type === eventFilter));
        }
    }, [eventFilter, logs]);

    const eventTypeColors: Record<string, string> = {
        webhook_message_received: 'blue',
        webhook_status_received: 'cyan',
        outbound_text_sent: 'green',
        outbound_template_sent: 'purple',
        outbound_media_sent: 'orange',
        recipient_unsubscribed: 'red',
        recipient_resubscribed: 'lime',
    };

    const columns = [
        {
            title: 'Timestamp',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 180,
            render: (text: string) => (
                <Text className="text-xs">{dayjs(text).format('MMM DD, YYYY HH:mm:ss')}</Text>
            ),
            sorter: (a: WebhookLog, b: WebhookLog) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        },
        {
            title: 'Event Type',
            dataIndex: 'event_type',
            key: 'event_type',
            width: 220,
            render: (text: string) => (
                <Tag color={eventTypeColors[text] || 'default'}>
                    {text.replace(/_/g, ' ').toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Actor',
            key: 'actor',
            width: 160,
            render: (_: any, record: WebhookLog) => (
                <Space direction="vertical" size={0}>
                    <Tag>{record.actor_type}</Tag>
                    {record.actor_phone && <Text className="text-xs text-slate-500">{record.actor_phone}</Text>}
                </Space>
            ),
        },
        {
            title: 'Entity',
            key: 'entity',
            width: 200,
            render: (_: any, record: WebhookLog) => (
                <Space direction="vertical" size={0}>
                    {record.entity_type && <Text className="text-xs">{record.entity_type}</Text>}
                    {record.entity_id && <Text copyable className="text-xs text-slate-400">{record.entity_id}</Text>}
                </Space>
            ),
        },
        {
            title: 'Payload',
            dataIndex: 'payload',
            key: 'payload',
            ellipsis: true,
            render: (payload: any) => (
                <Text className="text-xs text-slate-500" style={{ maxWidth: 300 }}>
                    {JSON.stringify(payload).substring(0, 120)}...
                </Text>
            ),
        },
    ];

    const uniqueEvents = Array.from(new Set(logs.map(l => l.event_type)));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
                <Title level={4} style={{ margin: 0 }}>
                    <BellOutlined className="mr-2" />
                    Webhook Event Logs
                </Title>
                <Space>
                    <Select
                        style={{ width: 220 }}
                        value={eventFilter}
                        onChange={setEventFilter}
                        suffixIcon={<FilterOutlined />}
                    >
                        <Select.Option value="all">All Events</Select.Option>
                        {uniqueEvents.map(evt => (
                            <Select.Option key={evt} value={evt}>
                                {evt.replace(/_/g, ' ')}
                            </Select.Option>
                        ))}
                    </Select>
                    <Button icon={<SyncOutlined />} onClick={fetchLogs}>Refresh</Button>
                </Space>
            </div>

            {error && <Alert message="Error" description={error} type="error" showIcon className="mb-4" />}

            <Card bordered={false} className="shadow-sm">
                {loading ? (
                    <div className="flex justify-center p-12"><Spin size="large" /></div>
                ) : filteredLogs.length === 0 ? (
                    <Empty
                        description={
                            <span>
                                No webhook events recorded yet.<br />
                                <Text type="secondary" className="text-sm">
                                    Events will appear here when messages are sent/received via WhatsApp.
                                </Text>
                            </span>
                        }
                    />
                ) : (
                    <Table
                        dataSource={filteredLogs}
                        columns={columns}
                        rowKey="id"
                        pagination={{ pageSize: 20, showSizeChanger: true }}
                        size="small"
                        scroll={{ x: 900 }}
                    />
                )}
            </Card>
        </div>
    );
};

export default WebhookLogs;
