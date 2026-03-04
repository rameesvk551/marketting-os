import React from 'react';
import { Typography, Card } from 'antd';

const { Title } = Typography;

export const BusinessProfilePage: React.FC = () => {
    return (
        <Card style={{ borderRadius: 12 }}>
            <Title level={4}>Business Profile</Title>
            <p>Configure your business details here.</p>
        </Card>
    );
};
