import React, { useState, useEffect } from 'react';
import { Card, Table, Spin, Alert, Button, Typography, Tag } from 'antd';
import { SyncOutlined, AppstoreOutlined, NotificationOutlined } from '@ant-design/icons';
import client from '../../../../api/client';

const { Title } = Typography;

const ConnectedAssets: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [assets, setAssets] = useState<any>({ adAccounts: [], wabaAccounts: [] });

    const fetchAssets = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.get('/whatsapp/meta/assets');
            if (response.data.status === 'success') {
                setAssets(response.data.data);
            } else {
                setError(response.data.message || 'Failed to fetch connected assets');
            }
        } catch (err: any) {
            console.error('Failed to fetch assets:', err);
            setError(err.response?.data?.message || err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssets();
    }, []);

    const adColumns = [
        {
            title: 'Account ID',
            dataIndex: 'id',
            key: 'id',
        },
        {
            title: 'Account Name',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => text || 'Unnamed Account',
        },
        {
            title: 'Status',
            dataIndex: 'account_status',
            key: 'account_status',
            render: (status: number) => {
                // Map status constants to text based on FB Ads API
                const statusMap: Record<number, { text: string; color: string }> = {
                    1: { text: 'Active', color: 'success' },
                    2: { text: 'Disabled', color: 'error' },
                    3: { text: 'Unsettled', color: 'warning' },
                };
                const formatted = statusMap[status] || { text: 'Unknown', color: 'default' };
                return <Tag color={formatted.color}>{formatted.text}</Tag>;
            },
        },
    ];

    const wabaColumns = [
        {
            title: 'WABA ID',
            dataIndex: 'id',
            key: 'id',
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => text || 'Unnamed WABA',
        },
        {
            title: 'Timezone',
            dataIndex: 'timezone_id',
            key: 'timezone_id',
        },
    ];

    if (loading) {
        return (
            <div className="flex justify-center items-center p-12">
                <Spin size="large" />
            </div>
        );
    }

    if (error) {
        return <Alert message="Error" description={error} type="error" showIcon />;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <Title level={4} style={{ margin: 0 }}>Connected Meta Assets</Title>
                <Button icon={<SyncOutlined />} onClick={fetchAssets}>Refresh</Button>
            </div>

            <Card title={<><AppstoreOutlined className="mr-2" />WhatsApp Business Accounts (WABA)</>} bordered={false} className="shadow-sm">
                <Table
                    dataSource={assets.wabaAccounts || []}
                    columns={wabaColumns}
                    rowKey="id"
                    pagination={false}
                    locale={{ emptyText: 'No WhatsApp Business Accounts found' }}
                />
            </Card>

            <Card title={<><NotificationOutlined className="mr-2" />Ad Accounts</>} bordered={false} className="shadow-sm mt-6">
                <Table
                    dataSource={assets.adAccounts || []}
                    columns={adColumns}
                    rowKey="id"
                    pagination={false}
                    locale={{ emptyText: 'No Ad Accounts found' }}
                />
            </Card>
        </div>
    );
};

export default ConnectedAssets;
