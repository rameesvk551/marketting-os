import React, { useState } from 'react';
import { Layout, Tabs, Typography, theme } from 'antd';
import {
    HomeOutlined,
    BranchesOutlined,
    MessageOutlined,
    FileTextOutlined,
    FolderOutlined,
    UserOutlined,
    BarChartOutlined,
    QuestionCircleOutlined,
} from '@ant-design/icons';
import InstagramAutomationForm from '../components/automation/InstagramAutomationForm';
import InstagramAutomationsList from '../components/automation/InstagramAutomationsList';
import InstagramInboxWorkspace from '../components/inbox/InstagramInboxWorkspace';
import InstagramAnalytics from '../components/InstagramAnalytics';
import { useResponsive } from '../../../hooks/useResponsive';

const { Content } = Layout;

const InstagramDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState('home');
    const { isMobile } = useResponsive();
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    const items = [
        {
            key: 'home',
            label: (
                <span style={{ fontSize: isMobile ? '13px' : '15px', fontWeight: 500 }}>
                    <HomeOutlined /> {!isMobile && 'Home'}
                </span>
            ),
            children: <InstagramAutomationForm />,
        },
        {
            key: 'automations',
            label: (
                <span style={{ fontSize: isMobile ? '13px' : '15px', fontWeight: 500 }}>
                    <BranchesOutlined /> {!isMobile && 'Automations'}
                </span>
            ),
            children: <InstagramAutomationsList />,
        },
        {
            key: 'inbox',
            label: (
                <span style={{ fontSize: isMobile ? '13px' : '15px', fontWeight: 500 }}>
                    <MessageOutlined /> {!isMobile && 'Inbox'}
                </span>
            ),
            children: <div style={{ padding: isMobile ? '12px' : '24px' }}><InstagramInboxWorkspace /></div>,
        },
        {
            key: 'templates',
            label: (
                <span style={{ fontSize: isMobile ? '13px' : '15px', fontWeight: 500 }}>
                    <FileTextOutlined /> {!isMobile && 'Templates'}
                </span>
            ),
            children: <div style={{ padding: isMobile ? '12px' : '24px' }}>Templates Coming Soon</div>,
        },
        {
            key: 'content',
            label: (
                <span style={{ fontSize: isMobile ? '13px' : '15px', fontWeight: 500 }}>
                    <FolderOutlined /> {!isMobile && 'Content'}
                </span>
            ),
            children: <div style={{ padding: isMobile ? '12px' : '24px' }}>Content Coming Soon</div>,
        },
        {
            key: 'contacts',
            label: (
                <span style={{ fontSize: isMobile ? '13px' : '15px', fontWeight: 500 }}>
                    <UserOutlined /> {!isMobile && 'Contacts'}
                </span>
            ),
            children: <div style={{ padding: isMobile ? '12px' : '24px' }}>Contacts Coming Soon</div>,
        },
        {
            key: 'analytics',
            label: (
                <span style={{ fontSize: isMobile ? '13px' : '15px', fontWeight: 500 }}>
                    <BarChartOutlined /> {!isMobile && 'Analytics'}
                </span>
            ),
            children: <div style={{ padding: isMobile ? '12px' : '24px' }}><InstagramAnalytics /></div>,
        },
        {
            key: 'support',
            label: (
                <span style={{ fontSize: isMobile ? '13px' : '15px', fontWeight: 500 }}>
                    <QuestionCircleOutlined /> {!isMobile && 'Support'}
                </span>
            ),
            children: <div style={{ padding: isMobile ? '12px' : '24px' }}>Support Coming Soon</div>,
        },
    ];

    return (
        <Layout style={{ minHeight: 'auto', background: '#f0f2f5' }}>
            <Content style={{ margin: isMobile ? '12px 8px' : '24px 24px' }}>
                <div
                    style={{
                        padding: 0,
                        background: colorBgContainer,
                        borderRadius: borderRadiusLG,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                        overflow: 'hidden',
                        minHeight: 'auto'
                    }}
                >
                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        items={items}
                        tabBarStyle={{
                            padding: isMobile ? '0 8px' : '0 24px',
                            marginBottom: 0,
                            borderBottom: '1px solid #f0f0f0',
                            height: isMobile ? 48 : 64,
                            display: 'flex',
                            alignItems: 'center'
                        }}
                        style={{ height: '100%' }}
                        size={isMobile ? 'small' : 'large'}
                    />
                </div>
            </Content>
        </Layout>
    );
};

export default InstagramDashboard;
