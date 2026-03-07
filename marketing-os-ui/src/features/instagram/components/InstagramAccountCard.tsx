import React, { useState } from 'react';
import { Card, Avatar, Button, Tag, Typography, Row, Col, Tooltip, Progress, Input, message as antMessage } from 'antd';
import {
    InstagramOutlined,
    UserOutlined,
    LinkOutlined,
    DisconnectOutlined,
    ReloadOutlined,
    CheckCircleFilled,
    CameraOutlined,
    HeartOutlined,
    TeamOutlined,
    RiseOutlined,
    SafetyCertificateOutlined,
    ApiOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons';
import { useInstagramAuth } from '../hooks/useInstagramAuth';

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
        refreshToken,
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
        const tokenHealth = account.status === 'active' ? 100 : account.status === 'token_expired' ? 10 : 50;

        return (
            <div>
                {/* ── Hero Profile Card ── */}
                <Card
                    style={{
                        borderRadius: 20, overflow: 'hidden', border: 'none',
                        boxShadow: '0 4px 24px rgba(131,58,180,0.10), 0 1px 4px rgba(0,0,0,0.04)',
                        marginBottom: 20,
                    }}
                    styles={{ body: { padding: 0 } }}
                >
                    {/* Gradient Banner */}
                    <div style={{
                        background: IG_GRADIENT, height: 140, position: 'relative',
                        display: 'flex', alignItems: 'flex-end', padding: '0 32px 0',
                    }}>
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.10) 0%, transparent 40%)',
                        }} />
                        <div style={{ position: 'relative', top: 40, zIndex: 2 }}>
                            <div style={{
                                padding: 4, borderRadius: '50%', background: '#fff',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.12)', display: 'inline-block',
                            }}>
                                <Avatar size={88} src={account.profilePictureUrl} icon={<UserOutlined />} style={{ border: '3px solid #fff' }} />
                            </div>
                        </div>
                        <div style={{ position: 'absolute', top: 16, right: 20, display: 'flex', gap: 8, zIndex: 2 }}>
                            <Tooltip title="Refresh Token">
                                <Button icon={<ReloadOutlined />} onClick={() => refreshToken(account.id)} shape="circle" size="small"
                                    style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', backdropFilter: 'blur(8px)' }}
                                />
                            </Tooltip>
                            <Button icon={<DisconnectOutlined />} onClick={() => disconnect(account.id)} loading={isDisconnecting} size="small"
                                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', backdropFilter: 'blur(8px)', borderRadius: 20, fontWeight: 500, fontSize: 12, padding: '0 14px' }}
                            >
                                Disconnect
                            </Button>
                        </div>
                    </div>
                    <div style={{ padding: '48px 32px 28px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <Title level={4} style={{ margin: 0, fontWeight: 700, letterSpacing: '-0.3px' }}>@{account.username}</Title>
                            <Tag icon={<CheckCircleFilled />} color="success" style={{ borderRadius: 20, fontWeight: 600, fontSize: 11, padding: '0 10px' }}>Connected</Tag>
                            <Tag color="purple" style={{ borderRadius: 20, fontWeight: 500, fontSize: 11, padding: '0 10px' }}>{account.accountType}</Tag>
                        </div>
                        <Text type="secondary" style={{ fontSize: 14 }}>{account.name || 'Instagram Business Account'}</Text>
                    </div>
                </Card>

                {/* ── Stats Grid ── */}
                <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                    {[
                        { icon: <TeamOutlined style={{ fontSize: 20, color: '#833AB4' }} />, label: 'Followers', value: account.followersCount || 0, color: '#f3e8ff', suffix: <RiseOutlined style={{ color: '#22c55e', fontSize: 12 }} /> },
                        { icon: <HeartOutlined style={{ fontSize: 20, color: '#FD1D1D' }} />, label: 'Following', value: account.followsCount || 0, color: '#fff1f2' },
                        { icon: <CameraOutlined style={{ fontSize: 20, color: '#F77737' }} />, label: 'Posts', value: account.mediaCount || 0, color: '#fff7ed' },
                    ].map((stat, idx) => (
                        <Col xs={24} sm={8} key={idx}>
                            <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', background: stat.color }} styles={{ body: { padding: '20px 24px' } }} hoverable>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                        {stat.icon}
                                    </div>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</Text>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Title level={3} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.5px' }}>{(stat.value || 0).toLocaleString()}</Title>
                                            {stat.suffix}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {/* ── Status Cards ── */}
                <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                        <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }} styles={{ body: { padding: '20px 24px' } }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                                <SafetyCertificateOutlined style={{ fontSize: 18, color: '#22c55e' }} />
                                <Text strong style={{ fontSize: 14 }}>Token Health</Text>
                            </div>
                            <Progress percent={tokenHealth} strokeColor={tokenHealth > 50 ? { from: '#22c55e', to: '#86efac' } : { from: '#ef4444', to: '#fca5a5' }} trailColor="#f1f5f9" strokeWidth={10} style={{ marginBottom: 8 }} />
                            <Text type="secondary" style={{ fontSize: 12 }}>{account.status === 'active' ? 'Token is healthy and active' : 'Token needs attention'}</Text>
                        </Card>
                    </Col>
                    <Col xs={24} md={12}>
                        <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }} styles={{ body: { padding: '20px 24px' } }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                                <ApiOutlined style={{ fontSize: 18, color: '#833AB4' }} />
                                <Text strong style={{ fontSize: 14 }}>API Status</Text>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {['Content Publishing', 'Comments', 'Insights', 'Messaging'].map(api => (
                                    <Tag key={api} color="green" style={{ borderRadius: 20, padding: '2px 12px', fontSize: 12, fontWeight: 500, margin: '2px 0' }}>✓ {api}</Tag>
                                ))}
                            </div>
                            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 10 }}>
                                Last synced: {account.lastSyncedAt ? new Date(account.lastSyncedAt).toLocaleString() : 'Never'}
                            </Text>
                        </Card>
                    </Col>
                </Row>
            </div>
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
