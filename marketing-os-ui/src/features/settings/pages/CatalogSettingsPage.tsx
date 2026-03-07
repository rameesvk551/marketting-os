import React from 'react';
import { Typography, Space, Breadcrumb } from 'antd';
import { HomeOutlined, SettingOutlined, ShopOutlined } from '@ant-design/icons';
import CatalogConnectionCard from '../../catalog/components/CatalogConnectionCard';
import { useCatalogConfig } from '../../catalog/hooks/useCatalog';

const { Title, Text } = Typography;

const CatalogSettingsPage: React.FC = () => {
    const { data: configData, isLoading: configLoading } = useCatalogConfig();

    return (
        <div>
            <Breadcrumb
                style={{ marginBottom: 16 }}
                items={[
                    { title: <HomeOutlined /> },
                    { title: <><SettingOutlined /> Settings</> },
                    { title: 'Catalog Integration' },
                ]}
            />
            <Space direction="vertical" size={4} style={{ marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0 }}>
                    <ShopOutlined style={{ marginRight: 8, color: '#4F46E5' }} />
                    Meta Catalog Configuration
                </Title>
                <Text type="secondary">Connect your Meta Product Catalog to sync products to Commerce Manager.</Text>
            </Space>

            <div style={{ maxWidth: 800 }}>
                <CatalogConnectionCard config={configData} isLoading={configLoading} />
            </div>
        </div>
    );
};

export default CatalogSettingsPage;
