import React from 'react';
import { Typography, Card } from 'antd';

const { Title } = Typography;

export const PaymentSettingsPage: React.FC = () => {
    return (
        <Card style={{ borderRadius: 12 }}>
            <Title level={4}>Payment Settings</Title>
            <p>Configure payment gateways and options here.</p>
        </Card>
    );
};
