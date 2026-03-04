// ── EmbeddedSignup ──
// Facebook Embedded Signup flow for WhatsApp Business API.
// Uses the Facebook JavaScript SDK (FB.login) — no redirect URI required.
// ZERO business logic — delegates to hook via props.

import React, { useCallback, useEffect, useState } from 'react';
import {
  Card,
  Button,
  Typography,
  Space,
  Alert,
  Steps,
  Spin,
  message as antMessage,
} from 'antd';
import {
  FacebookOutlined,
  CheckCircleOutlined,
  UserAddOutlined,
  PhoneOutlined,
  LinkOutlined,
  LoadingOutlined,
  WarningOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

// Extend Window to include FB SDK types
declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

interface EmbeddedSignupProps {
  embeddedConfig: { appId: string; configId: string; redirectUri: string } | null;
  onFetchConfig: () => void;
  isFetchingConfig: boolean;
  onComplete: (payload: { code: string; state?: string }) => void;
  isCompleting: boolean;
}

const EmbeddedSignup: React.FC<EmbeddedSignupProps> = ({
  embeddedConfig,
  onFetchConfig,
  isFetchingConfig,
  onComplete,
  isCompleting,
}) => {
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);

  // Load the Facebook JS SDK
  useEffect(() => {
    // If already loaded
    if (window.FB) {
      setSdkReady(true);
      return;
    }

    // Set up fbAsyncInit callback
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: embeddedConfig?.appId || '',
        cookie: true,
        xfbml: true,
        version: 'v21.0',
      });
      setSdkReady(true);
    };

    // Check if script already exists
    if (document.getElementById('facebook-jssdk')) {
      // Script tag exists but FB not ready yet - wait
      return;
    }

    // Inject the SDK script
    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    script.onerror = () => {
      setSdkError('Failed to load Facebook SDK. Please check your internet connection or ad-blocker.');
    };
    document.body.appendChild(script);
  }, [embeddedConfig?.appId]);

  // Re-init FB if appId changes after SDK is loaded
  useEffect(() => {
    if (sdkReady && window.FB && embeddedConfig?.appId) {
      window.FB.init({
        appId: embeddedConfig.appId,
        cookie: true,
        xfbml: true,
        version: 'v21.0',
      });
    }
  }, [sdkReady, embeddedConfig?.appId]);

  const handleFacebookLogin = useCallback(() => {
    if (!embeddedConfig) {
      onFetchConfig();
      return;
    }

    if (!sdkReady || !window.FB) {
      antMessage.error('Facebook SDK is not loaded yet. Please wait a moment and try again.');
      return;
    }

    // Use FB.login() which opens a managed popup — no redirect URI needed
    const loginOptions: any = {
      scope: 'business_management,whatsapp_business_management,whatsapp_business_messaging',
      extras: {
        feature: 'whatsapp_embedded_signup',
        setup: {},
      },
    };

    // If a config_id is set, include it
    if (embeddedConfig.configId) {
      loginOptions.config_id = embeddedConfig.configId;
    }

    window.FB.login(
      (response: any) => {
        if (response.authResponse) {
          // Got the code or access token
          const code = response.authResponse.code;
          const accessToken = response.authResponse.accessToken;

          if (code) {
            // Server-side flow: send the code to backend to exchange for long-lived token
            onComplete({ code });
          } else if (accessToken) {
            // Client-side flow: send the short-lived token as code
            onComplete({ code: accessToken });
          } else {
            antMessage.error('Facebook login succeeded but no authorization code was returned.');
          }
        } else {
          // User cancelled
          antMessage.info('Facebook login was cancelled.');
        }
      },
      loginOptions,
    );
  }, [embeddedConfig, onFetchConfig, onComplete, sdkReady]);

  return (
    <Card
      style={{ borderRadius: 12 }}
      styles={{ body: { padding: 32 } }}
    >
      <Space direction="vertical" size={4} style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          <FacebookOutlined style={{ marginRight: 8, color: '#1877F2' }} />
          Quick Setup with Facebook
        </Title>
        <Text type="secondary">
          New to WhatsApp Business API? Set up everything in minutes through Facebook's
          guided flow.
        </Text>
      </Space>

      {sdkError && (
        <Alert
          type="error"
          showIcon
          icon={<WarningOutlined />}
          message="Facebook SDK Error"
          description={sdkError}
          style={{ marginBottom: 16, borderRadius: 8 }}
        />
      )}

      <Alert
        type="success"
        showIcon
        icon={<CheckCircleOutlined />}
        message="Recommended for new users"
        description="This flow will automatically create a WhatsApp Business Account, verify your phone
          number, and configure webhooks — all in one step."
        style={{ marginBottom: 24, borderRadius: 8 }}
      />

      <Steps
        direction="vertical"
        size="small"
        current={-1}
        style={{ marginBottom: 24 }}
        items={[
          {
            title: 'Sign in with Facebook',
            description: 'Authenticate with your Meta Business account',
            icon: <UserAddOutlined />,
          },
          {
            title: 'Select or create phone number',
            description: 'Choose an existing number or register a new one',
            icon: <PhoneOutlined />,
          },
          {
            title: 'Auto-configure webhooks',
            description: 'We handle the technical setup automatically',
            icon: <LinkOutlined />,
          },
          {
            title: 'Start messaging',
            description: 'Your WhatsApp channel is ready to use',
            icon: <CheckCircleOutlined />,
          },
        ]}
      />

      {isCompleting ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />} />
          <Paragraph style={{ marginTop: 16 }} type="secondary">
            Completing setup... This may take a moment.
          </Paragraph>
        </div>
      ) : (
        <Button
          type="primary"
          size="large"
          icon={<FacebookOutlined />}
          loading={isFetchingConfig}
          disabled={!!sdkError}
          onClick={handleFacebookLogin}
          block
          style={{
            height: 48,
            borderRadius: 10,
            fontWeight: 600,
            background: '#1877F2',
            borderColor: '#1877F2',
          }}
        >
          {sdkReady ? 'Continue with Facebook' : 'Loading Facebook SDK...'}
        </Button>
      )}

      <Paragraph
        type="secondary"
        style={{ marginTop: 16, textAlign: 'center', fontSize: 12 }}
      >
        By continuing, you agree to Meta's terms for WhatsApp Business API access.
      </Paragraph>
    </Card>
  );
};

export default EmbeddedSignup;
