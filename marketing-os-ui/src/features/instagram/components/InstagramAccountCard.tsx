import React, { useState } from 'react';
import { Card, Button, Typography, Row, Col, Input, message as antMessage } from 'antd';
import {
    InstagramOutlined,
    LinkOutlined,
    CameraOutlined,
    HeartOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons';
import { useInstagramAuth } from '../hooks/useInstagramAuth';
import InstagramDashboardOverview from './InstagramDashboardOverview';

const { Text, Title, Paragraph } = Typography;



/* ── Instagram gradient palette ── */
const IG_GRADIENT = 'linear-gradient(135deg, #833AB4 0%, #FD1D1D 50%, #F77737 100%)';
const IG_GRADIENT_SOFT = 'linear-gradient(135deg, rgba(131,58,180,0.08) 0%, rgba(253,29,29,0.06) 50%, rgba(247,119,55,0.08) 100%)';

const InstagramAccountCard: React.FC = () => {
    const {
        isLoading,
        isConnected,
        accounts,
        connect,
        isConnecting,
        disconnect,
        isDisconnecting,
    } = useInstagramAuth();

    // Manual form state
    const [tokenInput, setTokenInput] = useState('');
    const [igUserIdInput, setIgUserIdInput] = useState('');

    // ── Manual connect handler ──
    const handleConnect = () => {
        if (!tokenInput.trim() || !igUserIdInput.trim()) {
            antMessage.warning('Please provide both Account ID and Access Token');
            return;
        }
        connect({ accessToken: tokenInput.trim(), igUserId: igUserIdInput.trim() });
        setTokenInput('');
        setIgUserIdInput('');
    };

    if (isLoading) {
        return (
            <Row gutter={[20, 20]}>
                {[1, 2, 3].map(i => (
                    <Col xs={24} md={8} key={i}>
                        <Card loading style={{ borderRadius: 16, height: 160 }} />
                    </Col>
                ))}
            </Row>
        );
    }

    /* ──────────────────────────────────────────────
       CONNECTED STATE
    ────────────────────────────────────────────── */
    if (isConnected && accounts.length > 0) {
        const account = accounts[0];

        return (
            <InstagramDashboardOverview
                account={account}
                onDisconnect={disconnect}
                isDisconnecting={isDisconnecting}
            />
        );
    }

    /* ──────────────────────────────────────────────
       DISCONNECTED STATE — Embedded Signup
    ────────────────────────────────────────────── */
    return (
        <div style={{ maxWidth: 560, margin: '40px auto', textAlign: 'center' }}>
            <Card
                style={{
                    borderRadius: 24, border: 'none',
                    boxShadow: '0 8px 40px rgba(131,58,180,0.10), 0 2px 8px rgba(0,0,0,0.04)',
                    overflow: 'hidden',
                }}
                styles={{ body: { padding: 0 } }}
            >
                {/* Top gradient strip */}
                <div style={{ height: 6, background: IG_GRADIENT }} />

                <div style={{ padding: '48px 40px 40px' }}>
                    {/* Logo */}
                    <div style={{
                        width: 96, height: 96, borderRadius: 28, background: IG_GRADIENT,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 28px',
                        boxShadow: '0 8px 32px rgba(131,58,180,0.30)',
                    }}>
                        <InstagramOutlined style={{ fontSize: 44, color: '#fff' }} />
                    </div>

                    <Title level={3} style={{ marginBottom: 8, fontWeight: 700, letterSpacing: '-0.3px' }}>
                        Connect Your Instagram
                    </Title>
                    <Paragraph type="secondary" style={{ fontSize: 15, lineHeight: 1.6, maxWidth: 380, margin: '0 auto 32px' }}>
                        Link your Instagram Business or Creator account to start publishing and managing content.
                    </Paragraph>

                    {/* Features */}
                    <Row gutter={[12, 12]} style={{ marginBottom: 32, textAlign: 'left' }}>
                        {[
                            { icon: <CameraOutlined />, text: 'Publish posts, reels & carousels' },
                            { icon: <HeartOutlined />, text: 'Track engagement & insights' },
                            { icon: <ThunderboltOutlined />, text: 'Schedule & automate content' },
                        ].map((feature, i) => (
                            <Col span={24} key={i}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '10px 16px', borderRadius: 12, background: IG_GRADIENT_SOFT,
                                }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 10, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#833AB4', fontSize: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                        {feature.icon}
                                    </div>
                                    <Text style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{feature.text}</Text>
                                </div>
                            </Col>
                        ))}
                    </Row>

                    {/* ── Manual Configuration Form ── */}
                    <div style={{ textAlign: 'left', marginTop: 24 }}>
                        <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>Instagram Account ID</Typography.Text>
                        <Input
                            placeholder="e.g. 178414000000000"
                            value={igUserIdInput}
                            onChange={(e) => setIgUserIdInput(e.target.value)}
                            prefix={<InstagramOutlined style={{ color: '#94a3b8' }} />}
                            style={{ borderRadius: 12, marginBottom: 20, height: 42, fontSize: 14 }}
                        />

                        <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>Permanent Access Token</Typography.Text>
                        <Input.TextArea
                            placeholder="Paste your long-lived or permanent Page Access Token here..."
                            value={tokenInput}
                            onChange={(e) => setTokenInput(e.target.value)}
                            rows={3}
                            style={{ borderRadius: 12, marginBottom: 24, resize: 'none', fontSize: 14 }}
                        />

                        <Button
                            type="primary"
                            icon={<LinkOutlined />}
                            block
                            size="large"
                            onClick={handleConnect}
                            loading={isConnecting}
                            disabled={!tokenInput.trim() || !igUserIdInput.trim()}
                            style={{
                                borderRadius: 14, height: 50, fontWeight: 600, fontSize: 15,
                                background: IG_GRADIENT,
                                border: 'none',
                            }}
                        >
                            Connect Account
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default InstagramAccountCard;
