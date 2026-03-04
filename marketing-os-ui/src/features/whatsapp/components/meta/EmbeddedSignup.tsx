// ── Meta Embedded Signup (Tab version) ──
// Uses the Facebook JavaScript SDK (FB.login) for WhatsApp Embedded Signup.
// This component is self-contained — fetches config from the API and handles the flow.

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Typography, Steps, Button, Alert, Result, Spin, message as antMessage } from 'antd';
import { RocketOutlined, LinkOutlined, CheckCircleOutlined, SyncOutlined, FacebookOutlined, LoadingOutlined } from '@ant-design/icons';
import client from '../../../../api/client';

const { Title, Text, Paragraph } = Typography;

// Extend Window to include FB SDK types
declare global {
    interface Window {
        FB: any;
        fbAsyncInit: () => void;
    }
}

const EmbeddedSignup: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [config, setConfig] = useState<any>(null);
    const [configLoading, setConfigLoading] = useState(true);
    const [completing, setCompleting] = useState(false);
    const [sdkReady, setSdkReady] = useState(false);
    const [sdkError, setSdkError] = useState<string | null>(null);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        setConfigLoading(true);
        try {
            const response = await client.get('/whatsapp/settings/embedded/config');
            const data = response.data?.data;
            if (data) {
                setConfig(data);
                // Load Facebook SDK once we have the appId
                loadFacebookSDK(data.appId);
            }
        } catch (err: any) {
            console.error('Failed to fetch embedded signup config:', err);
        } finally {
            setConfigLoading(false);
        }
    };

    const loadFacebookSDK = (appId: string) => {
        if (!appId) return;

        // If already loaded
        if (window.FB) {
            window.FB.init({
                appId,
                cookie: true,
                xfbml: true,
                version: 'v21.0',
            });
            setSdkReady(true);
            return;
        }

        // Set up fbAsyncInit callback
        window.fbAsyncInit = function () {
            window.FB.init({
                appId,
                cookie: true,
                xfbml: true,
                version: 'v21.0',
            });
            setSdkReady(true);
        };

        // Check if script already exists
        if (document.getElementById('facebook-jssdk')) {
            return;
        }

        // Inject the SDK script
        const script = document.createElement('script');
        script.id = 'facebook-jssdk';
        script.src = 'https://connect.facebook.net/en_US/sdk.js';
        script.async = true;
        script.defer = true;
        script.crossOrigin = 'anonymous';
        script.onerror = () => {
            setSdkError('Failed to load Facebook SDK. Check your internet or ad-blocker.');
        };
        document.body.appendChild(script);
    };

    const handleStartOnboarding = useCallback(() => {
        if (!config?.appId) {
            antMessage.error('Configuration not loaded. Please refresh.');
            return;
        }

        if (!sdkReady || !window.FB) {
            antMessage.error('Facebook SDK is not loaded yet. Please wait a moment and try again.');
            return;
        }

        // Use FB.login() — no redirect URI needed
        const loginOptions: any = {
            scope: 'business_management,whatsapp_business_management,whatsapp_business_messaging',
            extras: {
                feature: 'whatsapp_embedded_signup',
                setup: {},
            },
        };

        if (config.configId) {
            loginOptions.config_id = config.configId;
        }

        window.FB.login(
            async (response: any) => {
                if (response.authResponse) {
                    const code = response.authResponse.code;
                    const accessToken = response.authResponse.accessToken;
                    const authCode = code || accessToken;

                    if (authCode) {
                        setCompleting(true);
                        setCurrentStep(2);
                        try {
                            await client.post('/whatsapp/settings/embedded/complete', {
                                code: authCode,
                            });
                            setCurrentStep(3);
                            antMessage.success('WhatsApp Business Account connected successfully!');
                        } catch (err: any) {
                            antMessage.error(err?.response?.data?.error || 'Failed to complete signup.');
                            setCurrentStep(0);
                        } finally {
                            setCompleting(false);
                        }
                    } else {
                        antMessage.error('Facebook login succeeded but no authorization code was returned.');
                    }
                } else {
                    antMessage.info('Facebook login was cancelled.');
                }
            },
            loginOptions,
        );

        setCurrentStep(1);
    }, [config, sdkReady]);

    const steps = [
        {
            title: 'Get Started',
            icon: <RocketOutlined />,
            description: 'Initiate business onboarding',
        },
        {
            title: 'Facebook Login',
            icon: <FacebookOutlined />,
            description: 'Authenticate with Meta',
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
                            App ID: <Text copyable>{config.appId}</Text> — {sdkReady ? 'Facebook SDK loaded. Ready to onboard clients.' : 'Loading Facebook SDK...'}
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

            {sdkError && (
                <Alert
                    message="Facebook SDK Error"
                    description={sdkError}
                    type="error"
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
                            icon={<FacebookOutlined />}
                            onClick={handleStartOnboarding}
                            disabled={!config?.appId || !sdkReady}
                            className="mt-4"
                            style={{
                                background: '#1877F2',
                                borderColor: '#1877F2',
                            }}
                        >
                            {sdkReady ? 'Start Onboarding' : 'Loading SDK...'}
                        </Button>
                    </div>
                )}

                {currentStep === 1 && (
                    <div style={{ textAlign: 'center', padding: '48px 0' }}>
                        <Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />} />
                        <Paragraph style={{ marginTop: 16 }} type="secondary">
                            Waiting for Facebook login to complete...
                        </Paragraph>
                    </div>
                )}

                {currentStep === 2 && completing && (
                    <div style={{ textAlign: 'center', padding: '48px 0' }}>
                        <Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />} />
                        <Paragraph style={{ marginTop: 16 }} type="secondary">
                            Linking your WhatsApp Business Account... This may take a moment.
                        </Paragraph>
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
