// features/catalog/components/SyncHistoryTable.tsx
// Table showing catalog sync history with status badges.

import { Table, Tag, Typography, Empty, Tooltip } from 'antd';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    SyncOutlined,
    ClockCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

interface SyncLog {
    id: string;
    syncType: string;
    status: string;
    totalProducts: number;
    syncedCount: number;
    failedCount: number;
    errors: any[];
    startedAt: string;
    completedAt: string | null;
}

interface SyncHistoryTableProps {
    logs: SyncLog[];
    isLoading: boolean;
}

const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    completed: { color: 'success', icon: <CheckCircleOutlined /> },
    failed: { color: 'error', icon: <CloseCircleOutlined /> },
    running: { color: 'processing', icon: <SyncOutlined spin /> },
    pending: { color: 'default', icon: <ClockCircleOutlined /> },
};

const syncTypeLabels: Record<string, string> = {
    full: 'Full Sync',
    incremental: 'Incremental',
    single: 'Single Product',
};

export default function SyncHistoryTable({ logs, isLoading }: SyncHistoryTableProps) {
    const columns: ColumnsType<SyncLog> = [
        {
            title: 'Type',
            dataIndex: 'syncType',
            key: 'syncType',
            width: 140,
            render: (type: string) => (
                <Tag style={{ borderRadius: 6 }}>
                    {syncTypeLabels[type] || type}
                </Tag>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 130,
            render: (status: string) => {
                const cfg = statusConfig[status] || statusConfig.pending;
                return (
                    <Tag icon={cfg.icon} color={cfg.color} style={{ borderRadius: 6 }}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Tag>
                );
            },
        },
        {
            title: 'Products',
            key: 'products',
            width: 160,
            render: (_: any, record: SyncLog) => (
                <div>
                    <Text style={{ fontSize: 13 }}>
                        <Text strong style={{ color: '#52C41A' }}>{record.syncedCount}</Text>
                        {' / '}
                        {record.totalProducts}
                        {record.failedCount > 0 && (
                            <Text type="danger" style={{ marginLeft: 8 }}>
                                ({record.failedCount} failed)
                            </Text>
                        )}
                    </Text>
                </div>
            ),
        },
        {
            title: 'Started',
            dataIndex: 'startedAt',
            key: 'startedAt',
            width: 180,
            render: (date: string) => (
                <Text style={{ fontSize: 13 }}>
                    {new Date(date).toLocaleString()}
                </Text>
            ),
        },
        {
            title: 'Duration',
            key: 'duration',
            width: 120,
            render: (_: any, record: SyncLog) => {
                if (!record.completedAt) return <Tag>In progress</Tag>;
                const ms = new Date(record.completedAt).getTime() - new Date(record.startedAt).getTime();
                const seconds = Math.round(ms / 1000);
                return (
                    <Text style={{ fontSize: 13 }}>
                        {seconds < 60 ? `${seconds}s` : `${Math.round(seconds / 60)}m ${seconds % 60}s`}
                    </Text>
                );
            },
        },
        {
            title: 'Errors',
            key: 'errors',
            width: 100,
            render: (_: any, record: SyncLog) => {
                if (!record.errors || record.errors.length === 0) {
                    return <Text type="secondary">—</Text>;
                }
                return (
                    <Tooltip title={record.errors.map((e: any) => e.error || e.message || JSON.stringify(e)).join('\n')}>
                        <Tag color="error" style={{ cursor: 'pointer', borderRadius: 6 }}>
                            {record.errors.length} error{record.errors.length > 1 ? 's' : ''}
                        </Tag>
                    </Tooltip>
                );
            },
        },
    ];

    return (
        <Table
            columns={columns}
            dataSource={logs}
            loading={isLoading}
            rowKey="id"
            pagination={{ pageSize: 10, showSizeChanger: false }}
            locale={{
                emptyText: (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="No sync history yet. Connect a catalog and sync your products."
                    />
                ),
            }}
            style={{ borderRadius: 12, overflow: 'hidden' }}
            size="middle"
        />
    );
}
