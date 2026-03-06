// features/catalog/pages/CatalogDashboard.tsx
// Main dashboard page for Meta Catalog management.

import { Typography, Space, Button, Card, Statistic, Row, Col, Alert } from 'antd';
import {
    SyncOutlined,
    ShoppingOutlined,
    CloudSyncOutlined,
    HistoryOutlined,
    ThunderboltOutlined,
    ShopOutlined,
} from '@ant-design/icons';
import CatalogConnectionCard from '../components/CatalogConnectionCard';
import SyncHistoryTable from '../components/SyncHistoryTable';
import { useCatalogConfig, useSyncLogs, useSyncAllProducts } from '../hooks/useCatalog';

const { Title, Text } = Typography;

export default function CatalogDashboard() {
    const { data: configData, isLoading: configLoading } = useCatalogConfig();
    const { data: logsData, isLoading: logsLoading } = useSyncLogs(20);
    const syncAllMutation = useSyncAllProducts();

    const config = configData?.data;
    const logs = logsData?.data || [];
    const isConnected = config?.connectionStatus === 'active';

    // Compute stats from logs
    const lastSync = logs[0];
    const totalSynced = logs.reduce((acc: number, log: any) => acc + (log.syncedCount || 0), 0);
    const totalFailed = logs.reduce((acc: number, log: any) => acc + (log.failedCount || 0), 0);

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <Space align="center" style={{ marginBottom: 4 }}>
                            <ShoppingOutlined style={{ fontSize: 24, color: '#4F46E5' }} />
                            <Title level={3} style={{ margin: 0 }}>Product Catalog</Title>
                        </Space>
                        <Text type="secondary" style={{ display: 'block', fontSize: 14 }}>
                            Sync your products to Meta — power Instagram Shopping, WhatsApp Commerce & Dynamic Ads
                        </Text>
                    </div>

                    {isConnected && (
                        <Button
                            type="primary"
                            icon={<SyncOutlined spin={syncAllMutation.isPending} />}
                            size="large"
                            loading={syncAllMutation.isPending}
                            onClick={() => syncAllMutation.mutate()}
                            style={{
                                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                                border: 'none',
                                height: 44,
                                borderRadius: 10,
                                fontWeight: 600,
                            }}
                        >
                            {syncAllMutation.isPending ? 'Syncing...' : 'Sync All Products'}
                        </Button>
                    )}
                </div>
            </div>

            {/* Info Banner */}
            {!isConnected && !configLoading && (
                <Alert
                    message="Connect Your Meta Product Catalog"
                    description={
                        <span>
                            Once connected, your products will automatically sync to Meta's commerce ecosystem.
                            They'll be available for <strong>Instagram Shopping</strong> (product tags in posts),{' '}
                            <strong>WhatsApp Commerce</strong> (catalog messages), and{' '}
                            <strong>Advantage+ Catalog Ads</strong> (dynamic retargeting).
                        </span>
                    }
                    type="info"
                    showIcon
                    icon={<ThunderboltOutlined />}
                    style={{ marginBottom: 24, borderRadius: 12 }}
                    closable
                />
            )}

            {/* Connection Card */}
            <div style={{ marginBottom: 24 }}>
                <CatalogConnectionCard config={configData} isLoading={configLoading} />
            </div>

            {/* Stats Row */}
            {isConnected && (
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={8}>
                        <Card
                            style={{ borderRadius: 12, background: 'linear-gradient(135deg, #F0F5FF, #FFFFFF)', border: '1px solid #D6E4FF' }}
                        >
                            <Statistic
                                title={<span style={{ color: '#64748B' }}>Total Products Synced</span>}
                                value={totalSynced}
                                prefix={<CloudSyncOutlined style={{ color: '#4F46E5' }} />}
                                valueStyle={{ color: '#4F46E5', fontWeight: 700 }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card
                            style={{ borderRadius: 12, background: 'linear-gradient(135deg, #F6FFED, #FFFFFF)', border: '1px solid #B7EB8F' }}
                        >
                            <Statistic
                                title={<span style={{ color: '#64748B' }}>Last Sync Status</span>}
                                value={lastSync ? lastSync.status.charAt(0).toUpperCase() + lastSync.status.slice(1) : 'N/A'}
                                prefix={<HistoryOutlined style={{ color: '#52C41A' }} />}
                                valueStyle={{ color: '#52C41A', fontWeight: 700 }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card
                            style={{ borderRadius: 12, background: totalFailed > 0 ? 'linear-gradient(135deg, #FFF2F0, #FFFFFF)' : 'linear-gradient(135deg, #F0F5FF, #FFFFFF)', border: totalFailed > 0 ? '1px solid #FFCCC7' : '1px solid #D6E4FF' }}
                        >
                            <Statistic
                                title={<span style={{ color: '#64748B' }}>Failed Syncs</span>}
                                value={totalFailed}
                                prefix={<ShopOutlined style={{ color: totalFailed > 0 ? '#FF4D4F' : '#4F46E5' }} />}
                                valueStyle={{ color: totalFailed > 0 ? '#FF4D4F' : '#4F46E5', fontWeight: 700 }}
                            />
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Sync History */}
            <Card
                title={
                    <Space>
                        <HistoryOutlined style={{ color: '#4F46E5' }} />
                        <span>Sync History</span>
                    </Space>
                }
                style={{ borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
            >
                <SyncHistoryTable logs={logs} isLoading={logsLoading} />
            </Card>
        </div>
    );
}
