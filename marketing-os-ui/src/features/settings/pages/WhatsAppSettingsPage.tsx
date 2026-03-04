// ── WhatsAppSettingsPage ──
// Page for WhatsApp API connection settings.
// NO logic here — hooks provide data, components render UI.

import React, { useState } from 'react';
import { Typography, Spin, Alert, Space, Breadcrumb, Tabs } from 'antd';
import { WhatsAppOutlined, HomeOutlined, SettingOutlined, LinkOutlined, ShopOutlined, AppstoreOutlined, BellOutlined, RocketOutlined, UserOutlined } from '@ant-design/icons';
import { useWhatsAppConnection } from '../hooks';
import {
  ConnectionMethodSelector,
  ManualConfigForm,
  EmbeddedSignup,
  ConnectionStatus,
} from '../components';
import type { WhatsAppConnectionMethod } from '../types';

// Import Meta UI Components
import BusinessOverview from '../../whatsapp/components/meta/BusinessOverview';
import ConnectedAssets from '../../whatsapp/components/meta/ConnectedAssets';
import WebhookLogs from '../../whatsapp/components/meta/WebhookLogs';
import MetaEmbeddedSignup from '../../whatsapp/components/meta/EmbeddedSignup';
import UserProfile from '../../whatsapp/components/meta/UserProfile';

const { Title, Text } = Typography;

const WhatsAppSettingsPage: React.FC = () => {
  const [method, setMethod] = useState<WhatsAppConnectionMethod>('manual');

  const {
    connection,
    isLoading,
    isError,
    error,
    embeddedConfig,
    fetchEmbeddedConfig,
    isEmbeddedConfigLoading,
    saveManual,
    isSavingManual,
    testConnection,
    isTesting,
    completeEmbedded,
    isCompletingEmbedded,
    disconnect,
    isDisconnecting,
    regenerateVerifyToken,
    isRegenerating,
  } = useWhatsAppConnection();

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">Loading WhatsApp settings...</Text>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert
        type="error"
        message="Failed to load WhatsApp settings"
        description={(error as any)?.message || 'Please try again later.'}
        showIcon
        style={{ borderRadius: 8 }}
      />
    );
  }

  const isConnected = connection?.status === 'connected';

  return (
    <div>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          { title: <HomeOutlined /> },
          { title: <><SettingOutlined /> Settings</> },
          { title: <><WhatsAppOutlined /> WhatsApp API</> },
        ]}
      />

      <Space direction="vertical" size={4} style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          <WhatsAppOutlined style={{ marginRight: 8, color: '#25D366' }} />
          WhatsApp API Connection
        </Title>
        <Text type="secondary">
          Connect your WhatsApp Business account to send messages, manage conversations,
          and automate communications.
        </Text>
      </Space>

      {/* Tabbed interface for WhatsApp Settings & Meta Hub */}
      <Tabs
        defaultActiveKey="connection"
        size="large"
        items={[
          {
            key: 'connection',
            label: (
              <span><LinkOutlined /> Connection</span>
            ),
            children: (
              <div style={{ marginTop: 16 }}>
                {isConnected && connection ? (
                  <ConnectionStatus
                    connection={connection}
                    onTest={testConnection}
                    isTesting={isTesting}
                    onDisconnect={disconnect}
                    isDisconnecting={isDisconnecting}
                    onRegenerateToken={regenerateVerifyToken}
                    isRegenerating={isRegenerating}
                  />
                ) : (
                  <Space direction="vertical" size={24} style={{ width: '100%' }}>
                    {/* Method selection */}
                    <ConnectionMethodSelector value={method} onChange={setMethod} />

                    {/* Show form based on selected method */}
                    {method === 'manual' ? (
                      <ManualConfigForm
                        initialValues={
                          connection
                            ? {
                              whatsappBusinessAccountId:
                                connection.whatsappBusinessAccountId || '',
                              phoneNumberId: connection.phoneNumberId || '',
                              displayPhoneNumber: connection.displayPhoneNumber || '',
                              businessName: connection.businessName || '',
                              webhookUrl: connection.webhookUrl || '',
                              verifyToken: connection.verifyToken || '',
                            }
                            : null
                        }
                        onSubmit={saveManual}
                        isSubmitting={isSavingManual}
                        isEditMode={!!connection}
                      />
                    ) : (
                      <EmbeddedSignup
                        embeddedConfig={embeddedConfig}
                        onFetchConfig={() => fetchEmbeddedConfig()}
                        isFetchingConfig={isEmbeddedConfigLoading}
                        onComplete={completeEmbedded}
                        isCompleting={isCompletingEmbedded}
                      />
                    )}
                  </Space>
                )}
              </div>
            )
          },
          {
            key: 'overview',
            label: <span><ShopOutlined /> Business Overview</span>,
            children: <div style={{ marginTop: 16 }}><BusinessOverview /></div>
          },
          {
            key: 'assets',
            label: <span><AppstoreOutlined /> Connected Assets</span>,
            children: <div style={{ marginTop: 16 }}><ConnectedAssets /></div>
          },
          {
            key: 'webhooks',
            label: <span><BellOutlined /> Webhook Logs</span>,
            children: <div style={{ marginTop: 16 }}><WebhookLogs /></div>
          },
          {
            key: 'signup',
            label: <span><RocketOutlined /> Embedded Signup</span>,
            children: <div style={{ marginTop: 16 }}><MetaEmbeddedSignup /></div>
          },
          {
            key: 'profile',
            label: <span><UserOutlined /> User Profile</span>,
            children: <div style={{ marginTop: 16 }}><UserProfile /></div>
          }
        ]}
      />
    </div>
  );
};

export default WhatsAppSettingsPage;
