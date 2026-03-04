import React, { useState, useEffect } from 'react';
import { Card, Typography, Descriptions, Spin, Tag, Alert, Row, Col, Statistic, Button } from 'antd';
import { SyncOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import client from '../../../../api/client';

const { Title, Text } = Typography;

const BusinessOverview: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [businessData, setBusinessData] = useState<any>(null);

    const fetchBusinessDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.get('/whatsapp/meta/business-details');
            if (response.data.status === 'success') {
                setBusinessData(response.data.data);
            } else {
                setError(response.data.message || 'Failed to fetch business details');
            }
        } catch (err: any) {
            console.error('Failed to fetch business details:', err);
            setError(err.response?.data?.message || err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBusinessDetails();
    }, []);

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

    if (!businessData || !businessData.data || businessData.data.length === 0) {
        return (
            <Alert
                message="No Meta Business Found"
                description="Your account does not seem to be linked to a Meta Business, or the business does not exist."
                type="warning"
                showIcon
            />
        );
    }

    // Determine primary business
    const primaryBusiness = businessData.data[0];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <Title level={4} style={{ margin: 0 }}>Meta Business Overview</Title>
                <Button icon={<SyncOutlined />} onClick={fetchBusinessDetails}>Refresh</Button>
            </div>

            <Row gutter={[16, 16]}>
                <Col xs={24} md={16}>
                    <Card title="Business Details" bordered={false} className="shadow-sm">
                        <Descriptions column={1} bordered size="small">
                            <Descriptions.Item label="Business Name">{primaryBusiness.name}</Descriptions.Item>
                            <Descriptions.Item label="Business ID">
                                <Text copyable>{primaryBusiness.id}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Verification Status">
                                {primaryBusiness.verification_status === 'verified' ? (
                                    <Tag color="success" icon={<SafetyCertificateOutlined />}>Verified</Tag>
                                ) : (
                                    <Tag color="warning">Unverified</Tag>
                                )}
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card bordered={false} className="shadow-sm h-full flex flex-col justify-center text-center">
                        <Statistic
                            title="Owned Businesses"
                            value={businessData.data.length}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default BusinessOverview;
