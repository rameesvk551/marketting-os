import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Table, Spin, message, Alert } from 'antd';
import { instagramApi } from '../api/instagramApi';
import { useInstagramAuth } from '../hooks/useInstagramAuth';

const { Title } = Typography;

const InstagramAnalytics: React.FC = () => {
    const { accounts } = useInstagramAuth();
    const activeAccount = accounts?.[0];
    const activeAccountId = activeAccount?.id;

    const [loading, setLoading] = useState(false);
    const [insights, setInsights] = useState<any[]>([]);
    const [mediaList, setMediaList] = useState<any[]>([]);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        if (activeAccountId) {
            fetchAnalytics(activeAccountId);
        }
    }, [activeAccountId]);

    const fetchAnalytics = async (accountId: string) => {
        setLoading(true);
        setErrorMsg(null);
        try {
            const overviewRes = await instagramApi.getAccountInsights(accountId, 'day');

            if (overviewRes.data && overviewRes.data.message) {
                setErrorMsg(overviewRes.data.message);
                setInsights([]);
            } else {
                setInsights(overviewRes.data || []);
            }

            const mediaRes = await instagramApi.getMediaAnalytics(accountId);
            setMediaList(mediaRes.data || []);
        } catch (error: any) {
            message.error('Failed to load analytics: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!activeAccountId) {
        return <Alert message="Please select an Instagram account to view analytics." type="info" showIcon />;
    }

    // Helper to find metric value
    const getMetricTotal = (name: string) => {
        const metric = insights.find(i => i.name === name);
        if (!metric || !metric.values || metric.values.length === 0) return 0;
        // Summing up values (for 'day' period, there might be a few data points)
        return metric.values.reduce((acc: number, val: any) => acc + (val.value || 0), 0);
    };

    const columns = [
        {
            title: 'Media',
            dataIndex: 'mediaUrl',
            key: 'mediaUrl',
            render: (url: string, record: any) => (
                <img
                    src={record.thumbnailUrl || url}
                    alt="media"
                    style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }}
                />
            )
        },
        {
            title: 'Caption',
            dataIndex: 'caption',
            key: 'caption',
            ellipsis: true,
            render: (text: string) => text ? text.substring(0, 30) + '...' : 'No caption'
        },
        {
            title: 'Likes',
            dataIndex: 'likeCount',
            key: 'likes',
            sorter: (a: any, b: any) => (a.likeCount || 0) - (b.likeCount || 0),
        },
        {
            title: 'Comments',
            dataIndex: 'commentsCount',
            key: 'comments',
            sorter: (a: any, b: any) => (a.commentsCount || 0) - (b.commentsCount || 0),
        },
        {
            title: 'Posted On',
            dataIndex: 'timestamp',
            key: 'timestamp',
            render: (ts: string) => new Date(ts).toLocaleDateString(),
            sorter: (a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        }
    ];

    return (
        <Card title={`Analytics for @${activeAccount?.username || 'Account'}`} bordered={false}>
            {loading && !insights.length && <Spin style={{ display: 'block', margin: '20px auto' }} />}

            {errorMsg && (
                <Alert message="Notice" description={errorMsg} type="warning" showIcon style={{ marginBottom: 24 }} />
            )}

            {!errorMsg && insights.length > 0 && (
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={8}>
                        <Card size="small" variant="borderless" style={{ background: '#f5f5f5' }}>
                            <Statistic title="Impressions (Today)" value={getMetricTotal('impressions')} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card size="small" variant="borderless" style={{ background: '#f5f5f5' }}>
                            <Statistic title="Reach (Today)" value={getMetricTotal('reach')} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card size="small" variant="borderless" style={{ background: '#f5f5f5' }}>
                            <Statistic title="Profile Views (Today)" value={getMetricTotal('profile_views')} />
                        </Card>
                    </Col>
                </Row>
            )}

            <Title level={5} style={{ marginTop: 32, marginBottom: 16 }}>Top Performing Content</Title>
            <Table
                dataSource={mediaList}
                columns={columns}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                loading={loading}
                size="middle"
            />
        </Card>
    );
};

export default InstagramAnalytics;
