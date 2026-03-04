import React, { useState, useEffect } from 'react';
import { Card, Typography, Steps, Button, Alert, Result, Input, Form, Space, Divider, Spin } from 'antd';
import { RocketOutlined, PhoneOutlined, LinkOutlined, CheckCircleOutlined, SyncOutlined } from '@ant-design/icons';
import client from '../../../../api/client';

const { Title, Text, Paragraph } = Typography;

const EmbeddedSignup: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [_loading, _setLoading] = useState(false);
    const [config, setConfig] = useState<any>(null);
    const [configLoading, setConfigLoading] = useState(true);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        setConfigLoading(true);
        try {
            const response = await client.get('/whatsapp/settings/embedded/config');
            if (response.data.status === 'success') {
                setConfig(response.data.data);
            }
        } catch (err: any) {
            console.error('Failed to fetch embedded signup config:', err);
        } finally {
            setConfigLoading(false);
        }
    };

    const handleStartOnboarding = () => {
        // In production, this would launch the Facebook Embedded Signup SDK
        // For now, we show the step-by-step flow
        setCurrentStep(1);
    };

    const steps = [
        {
            title: 'Get Started',
            icon: <RocketOutlined />,
            description: 'Initiate business onboarding',
        },
        {
            title: 'Register Phone',
            icon: <PhoneOutlined />,
            description: 'Register a new phone number',
        },
        {
            title: 'Link WABA',
            icon: <LinkOutlined />,
            description: 'Link to WhatsApp Business Account',
        },
        {
            title: 'Complete',
            icon: <CheckCircleOutlined />,
            description: 'Onboarding complete',
        },
    ];

    if (configLoading) {
        return (
            <div className="flex justify-center items-center p-12">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <Title level={4} style={{ margin: 0 }}>
                    <RocketOutlined className="mr-2" />
                    Embedded Signup &amp; Onboarding
                </Title>
                <Button icon={<SyncOutlined />} onClick={fetchConfig}>
                    Refresh Config
                </Button>
            </div>

            {/* Status Banner */}
            {config?.appId ? (
                <Alert
                    message="Embedded Signup Ready"
                    description={
                        <span>
                            App ID: <Text copyable>{config.appId}</Text> — Configuration is available for embedded signup.
                        </span>
                    }
                    type="success"
                    showIcon
                />
            ) : (
                <Alert
                    message="Configuration Required"
                    description="Meta App ID (META_APP_ID) and App Secret (META_APP_SECRET) must be configured in `.env` to enable Embedded Signup."
                    type="warning"
                    showIcon
                />
            )}

            {/* Steps Progress */}
            <Card bordered={false} className="shadow-sm">
                <Steps
                    current={currentStep}
                    items={steps}
                    className="mb-8"
                />

                <Divider />

                {/* Step Content */}
                {currentStep === 0 && (
                    <div className="text-center py-8">
                        <Title level={4}>New Business Onboarding</Title>
                        <Paragraph className="text-slate-500 max-w-lg mx-auto">
                            Use Meta's Embedded Signup flow to onboard new businesses.
                            This will guide them through creating or linking a WhatsApp Business Account,
                            registering a phone number, and connecting it to your platform.
                        </Paragraph>
                        <Button
                            type="primary"
                            size="large"
                            icon={<RocketOutlined />}
                            onClick={handleStartOnboarding}
                            disabled={!config?.appId}
                            className="mt-4"
                        >
                            Start Onboarding
                        </Button>
                    </div>
                )}

                {currentStep === 1 && (
                    <div className="max-w-md mx-auto py-6">
                        <Title level={5}>Register a New Phone Number</Title>
                        <Paragraph type="secondary">
                            Provide the phone number that will be used for WhatsApp Business messaging.
                        </Paragraph>
                        <Form layout="vertical">
                            <Form.Item label="Phone Number (with country code)" required>
                                <Input placeholder="+91 98765 43210" size="large" />
                            </Form.Item>
                            <Form.Item label="Display Name" required>
                                <Input placeholder="Your Business Name" size="large" />
                            </Form.Item>
                            <Space>
                                <Button onClick={() => setCurrentStep(0)}>Back</Button>
                                <Button type="primary" onClick={() => setCurrentStep(2)}>
                                    Register &amp; Continue
                                </Button>
                            </Space>
                        </Form>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="max-w-md mx-auto py-6">
                        <Title level={5}>Link to WhatsApp Business Account</Title>
                        <Paragraph type="secondary">
                            Select or create a WABA to link this phone number to.
                        </Paragraph>
                        <Form layout="vertical">
                            <Form.Item label="WABA ID (optional — leave blank to create new)">
                                <Input placeholder="e.g. 123456789012345" size="large" />
                            </Form.Item>
                            <Space>
                                <Button onClick={() => setCurrentStep(1)}>Back</Button>
                                <Button type="primary" onClick={() => setCurrentStep(3)}>
                                    Link &amp; Complete
                                </Button>
                            </Space>
                        </Form>
                    </div>
                )}

                {currentStep === 3 && (
                    <Result
                        status="success"
                        title="Onboarding Complete!"
                        subTitle="The new business has been onboarded. The phone number is registered and linked to the WABA."
                        extra={[
                            <Button key="another" onClick={() => setCurrentStep(0)}>
                                Onboard Another Business
                            </Button>,
                        ]}
                    />
                )}
            </Card>
        </div>
    );
};

export default EmbeddedSignup;
