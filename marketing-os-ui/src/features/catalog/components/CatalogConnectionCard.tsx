// features/catalog/components/CatalogConnectionCard.tsx
// Connection status card with connect/disconnect UI.

import { useState } from 'react';
import { Card, Button, Typography, Space, Tag, Input, Form, Modal, Descriptions, Tooltip } from 'antd';
import {
    LinkOutlined,
    DisconnectOutlined,
    CloudSyncOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    InfoCircleOutlined,
} from '@ant-design/icons';
import { useConnectCatalog, useDisconnectCatalog } from '../hooks/useCatalog';

const { Title, Text } = Typography;

interface CatalogConnectionCardProps {
    config: any;
    isLoading: boolean;
}

export default function CatalogConnectionCard({ config, isLoading }: CatalogConnectionCardProps) {
    const [connectModalOpen, setConnectModalOpen] = useState(false);
    const [form] = Form.useForm();

    const connectMutation = useConnectCatalog();
    const disconnectMutation = useDisconnectCatalog();

    const isConnected = config?.data?.connectionStatus === 'active';

    const handleConnect = async (values: any) => {
        await connectMutation.mutateAsync(values);
        setConnectModalOpen(false);
        form.resetFields();
    };

    const handleDisconnect = () => {
        Modal.confirm({
            title: 'Disconnect Catalog',
            content: 'Are you sure you want to disconnect this Meta Catalog? Products will no longer sync.',
            okText: 'Disconnect',
            okType: 'danger',
            onOk: () => disconnectMutation.mutateAsync(config.data.id),
        });
    };

    return (
        <>
            <Card
                loading={isLoading}
                style={{
                    borderRadius: 16,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    border: isConnected ? '1px solid #B7EB8F' : '1px solid #E2E8F0',
                    background: isConnected
                        ? 'linear-gradient(135deg, #F6FFED 0%, #FFFFFF 100%)'
                        : '#FFFFFF',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ flex: 1, minWidth: 240 }}>
                        <Space align="center" style={{ marginBottom: 12 }}>
                            <div
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 12,
                                    background: isConnected
                                        ? 'linear-gradient(135deg, #52C41A, #73D13D)'
                                        : 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <CloudSyncOutlined style={{ color: '#fff', fontSize: 22 }} />
                            </div>
                            <div>
                                <Title level={5} style={{ margin: 0, fontSize: 16 }}>
                                    Meta Product Catalog
                                </Title>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    Sync products to Instagram Shopping, WhatsApp & Facebook Ads
                                </Text>
                            </div>
                        </Space>

                        {isConnected && config?.data ? (
                            <Descriptions column={1} size="small" style={{ marginTop: 8 }}>
                                <Descriptions.Item label="Catalog">
                                    <Text strong>{config.data.catalogName || config.data.catalogId}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Status">
                                    <Tag icon={<CheckCircleOutlined />} color="success">Connected</Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Last Sync">
                                    {config.data.lastSyncAt
                                        ? new Date(config.data.lastSyncAt).toLocaleString()
                                        : 'Never'}
                                </Descriptions.Item>
                                <Descriptions.Item label="Auto Sync">
                                    <Tag color={config.data.autoSyncEnabled ? 'green' : 'default'}>
                                        {config.data.autoSyncEnabled ? 'Enabled' : 'Disabled'}
                                    </Tag>
                                </Descriptions.Item>
                            </Descriptions>
                        ) : (
                            <div style={{ marginTop: 12 }}>
                                <Tag icon={<CloseCircleOutlined />} color="default">Not Connected</Tag>
                                <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 13 }}>
                                    Connect your Meta Business Catalog to start syncing products across
                                    Instagram Shopping, WhatsApp Commerce, and Facebook Ads.
                                </Text>
                            </div>
                        )}
                    </div>

                    <div>
                        {isConnected ? (
                            <Button
                                danger
                                icon={<DisconnectOutlined />}
                                onClick={handleDisconnect}
                                loading={disconnectMutation.isPending}
                            >
                                Disconnect
                            </Button>
                        ) : (
                            <Button
                                type="primary"
                                icon={<LinkOutlined />}
                                onClick={() => setConnectModalOpen(true)}
                                style={{
                                    background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                                    border: 'none',
                                    height: 40,
                                    borderRadius: 10,
                                }}
                            >
                                Connect Catalog
                            </Button>
                        )}
                    </div>
                </div>
            </Card>

            {/* Connect Modal */}
            <Modal
                title={
                    <Space>
                        <CloudSyncOutlined style={{ color: '#4F46E5' }} />
                        <span>Connect Meta Catalog</span>
                    </Space>
                }
                open={connectModalOpen}
                onCancel={() => { setConnectModalOpen(false); form.resetFields(); }}
                footer={null}
                destroyOnClose
            >
                <div style={{ marginBottom: 16, padding: '12px 16px', background: '#F0F5FF', borderRadius: 8, fontSize: 13 }}>
                    <InfoCircleOutlined style={{ color: '#1890FF', marginRight: 8 }} />
                    You can find your Catalog ID and Business ID in{' '}
                    <a href="https://business.facebook.com/commerce/catalogs" target="_blank" rel="noopener noreferrer">
                        Meta Commerce Manager
                    </a>.
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleConnect}
                >
                    <Form.Item
                        name="businessId"
                        label="Business ID"
                        rules={[{ required: true, message: 'Business ID is required' }]}
                    >
                        <Input placeholder="e.g. 864633239519648" />
                    </Form.Item>

                    <Form.Item
                        name="catalogId"
                        label="Catalog ID"
                        rules={[{ required: true, message: 'Catalog ID is required' }]}
                    >
                        <Input placeholder="e.g. 1234567890" />
                    </Form.Item>

                    <Form.Item name="catalogName" label="Catalog Name (optional)">
                        <Input placeholder="e.g. My Store Catalog" />
                    </Form.Item>

                    <Form.Item
                        name="accessToken"
                        label={
                            <Space>
                                Access Token
                                <Tooltip title="Use a System User token with catalog_management and business_management permissions">
                                    <InfoCircleOutlined style={{ color: '#94A3B8' }} />
                                </Tooltip>
                            </Space>
                        }
                        rules={[{ required: true, message: 'Access token is required' }]}
                    >
                        <Input.TextArea rows={3} placeholder="Paste your Meta access token here" />
                    </Form.Item>

                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <Button onClick={() => { setConnectModalOpen(false); form.resetFields(); }}>
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={connectMutation.isPending}
                            style={{
                                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                                border: 'none',
                            }}
                        >
                            Connect
                        </Button>
                    </div>
                </Form>
            </Modal>
        </>
    );
}
