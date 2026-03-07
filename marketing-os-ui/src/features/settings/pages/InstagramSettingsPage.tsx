import React from 'react';
import { Typography, Space, Breadcrumb } from 'antd';
import { HomeOutlined, SettingOutlined, InstagramOutlined } from '@ant-design/icons';
import InstagramAccountCard from '../../instagram/components/InstagramAccountCard';

const { Title, Text } = Typography;

const InstagramSettingsPage: React.FC = () => {
    return (
        <div>
            <Breadcrumb
                style={{ marginBottom: 16 }}
                items={[
                    { title: <HomeOutlined /> },
                    { title: <><SettingOutlined /> Settings</> },
                    { title: 'Instagram Integration' },
                ]}
            />
            <Space direction="vertical" size={4} style={{ marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0 }}>
                    <InstagramOutlined style={{ marginRight: 8, color: '#E1306C' }} />
                    Instagram Configuration
                </Title>
                <Text type="secondary">Connect your Instagram Business account to reply to comments and DMs.</Text>
            </Space>

            <InstagramAccountCard />
        </div>
    );
};

export default InstagramSettingsPage;
