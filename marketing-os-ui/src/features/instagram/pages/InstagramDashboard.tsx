import React, { useState } from 'react';
import { Layout, Tabs, Typography, theme } from 'antd';
import {
    HomeOutlined,
    EditOutlined,
    PictureOutlined,
    InstagramOutlined,
    MessageOutlined,
    LineChartOutlined,
} from '@ant-design/icons';
import InstagramAccountCard from '../components/InstagramAccountCard';
import PostComposer from '../components/PostComposer';
import MediaLibrary from '../components/MediaLibrary';
import SocialInbox from '../components/SocialInbox';
import InstagramAnalytics from '../components/InstagramAnalytics';
import { useResponsive } from '../../../hooks/useResponsive';

const { Content } = Layout;
const { Title } = Typography;

const IG_GRADIENT = 'linear-gradient(135deg, #833AB4 0%, #FD1D1D 50%, #F77737 100%)';

const InstagramDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const { isMobile } = useResponsive();
    const {
        token: { colorBgContainer },
    } = theme.useToken();

    const tabLabelStyle = { fontSize: isMobile ? '13px' : '14px', fontWeight: 600 };

    const items = [
        {
            key: 'overview',
            label: (
                <span style={tabLabelStyle}>
                    <HomeOutlined style={{ marginRight: 6 }} />{!isMobile && 'Overview'}
                </span>
            ),
            children: (
                <div style={{ padding: isMobile ? 12 : 28 }}>
                    <InstagramAccountCard />
                </div>
            ),
        },
        {
            key: 'publish',
            label: (
                <span style={tabLabelStyle}>
                    <EditOutlined style={{ marginRight: 6 }} />{!isMobile && 'Create Post'}
                </span>
            ),
            children: (
                <div style={{ padding: isMobile ? 12 : 28 }}>
                    <PostComposer />
                </div>
            ),
        },
        {
            key: 'media',
            label: (
                <span style={tabLabelStyle}>
                    <PictureOutlined style={{ marginRight: 6 }} />{!isMobile && 'Media Library'}
                </span>
            ),
            children: (
                <div style={{ padding: isMobile ? 12 : 28 }}>
                    <MediaLibrary />
                </div>
            ),
        },
        {
            key: 'inbox',
            label: (
                <span style={tabLabelStyle}>
                    <MessageOutlined style={{ marginRight: 6 }} />{!isMobile && 'Inbox'}
                </span>
            ),
            children: (
                <div style={{ padding: isMobile ? 12 : 28 }}>
                    <SocialInbox />
                </div>
            ),
        },
        {
            key: 'analytics',
            label: (
                <span style={tabLabelStyle}>
                    <LineChartOutlined style={{ marginRight: 6 }} />{!isMobile && 'Analytics'}
                </span>
            ),
            children: (
                <div style={{ padding: isMobile ? 12 : 28 }}>
                    <InstagramAnalytics />
                </div>
            ),
        },
    ];

    return (
        <Layout style={{ minHeight: '100vh', background: '#f8f9fb' }}>
            <Content style={{ margin: isMobile ? '12px 8px' : '24px 24px' }}>
                {/* ── Page Header ── */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    marginBottom: 24,
                }}>
                    <div style={{
                        width: isMobile ? 44 : 52,
                        height: isMobile ? 44 : 52,
                        borderRadius: 16,
                        background: IG_GRADIENT,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 20px rgba(131,58,180,0.25)',
                        flexShrink: 0,
                    }}>
                        <InstagramOutlined style={{ fontSize: isMobile ? 22 : 26, color: '#fff' }} />
                    </div>
                    <div>
                        <Title
                            level={isMobile ? 4 : 3}
                            style={{
                                margin: 0,
                                fontWeight: 800,
                                letterSpacing: '-0.5px',
                                color: '#0f172a',
                            }}
                        >
                            Instagram
                        </Title>
                        <Typography.Text type="secondary" style={{ fontSize: isMobile ? 12 : 14 }}>
                            Publish content, manage your media & grow your audience
                        </Typography.Text>
                    </div>
                </div>

                {/* ── Main Content Card ── */}
                <div
                    style={{
                        padding: 0,
                        background: colorBgContainer,
                        borderRadius: 20,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.03)',
                        overflow: 'hidden',
                        minHeight: '80vh',
                        border: '1px solid rgba(0,0,0,0.04)',
                    }}
                >
                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        items={items}
                        tabBarStyle={{
                            padding: isMobile ? '0 12px' : '0 28px',
                            marginBottom: 0,
                            borderBottom: '1px solid #f0f0f0',
                            height: isMobile ? 48 : 60,
                            display: 'flex',
                            alignItems: 'center',
                        }}
                        style={{ height: '100%' }}
                        size={isMobile ? 'small' : 'large'}
                    />
                </div>
            </Content>

            {/* ── Instagram-branded Tab Indicator ── */}
            <style>{`
                .ant-tabs-ink-bar {
                    background: ${IG_GRADIENT} !important;
                    height: 3px !important;
                    border-radius: 3px !important;
                }
                .ant-tabs-tab:hover {
                    color: #833AB4 !important;
                }
                .ant-tabs-tab-active .ant-tabs-tab-btn {
                    color: #833AB4 !important;
                }
            `}</style>
        </Layout>
    );
};

export default InstagramDashboard;
