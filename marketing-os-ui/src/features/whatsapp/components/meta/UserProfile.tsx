import React from 'react';
import { Card, Typography, Avatar, Descriptions, Tag } from 'antd';
import { UserOutlined, MailOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useAuth } from '../../../../context/AuthContext';

const { Title, Text } = Typography;

const UserProfile: React.FC = () => {
    const { user } = useAuth();

    return (
        <div className="space-y-6">
            <Title level={4} style={{ margin: 0 }}>
                <UserOutlined className="mr-2" />
                Meta Profile Info
            </Title>

            <Card bordered={false} className="shadow-sm">
                <div className="flex items-center gap-6 mb-6">
                    <Avatar size={80} icon={<UserOutlined />} className="bg-indigo-500" />
                    <div>
                        <Title level={4} style={{ margin: 0 }}>{user?.name || 'Unknown User'}</Title>
                        <Text type="secondary" className="flex items-center gap-1 mt-1">
                            <MailOutlined /> {user?.email || 'No email'}
                        </Text>
                        <div className="mt-2">
                            <Tag color="blue">{user?.role || 'user'}</Tag>
                            <Tag color="green" icon={<SafetyCertificateOutlined />}>Meta Linked</Tag>
                        </div>
                    </div>
                </div>

                <Descriptions column={1} bordered size="small">
                    <Descriptions.Item label="Name">{user?.name}</Descriptions.Item>
                    <Descriptions.Item label="Email">{user?.email}</Descriptions.Item>
                    <Descriptions.Item label="Role">{user?.role}</Descriptions.Item>
                    <Descriptions.Item label="Tenant">{user?.tenantName}</Descriptions.Item>
                    <Descriptions.Item label="Tenant ID">
                        <Text copyable>{user?.tenantId}</Text>
                    </Descriptions.Item>
                </Descriptions>
            </Card>
        </div>
    );
};

export default UserProfile;
