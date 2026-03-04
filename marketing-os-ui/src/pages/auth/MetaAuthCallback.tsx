import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Result, Spin, Button, Typography } from 'antd';
import client from '../../api/client';

const { Title, Paragraph } = Typography;

const MetaAuthCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get('code');
            const state = searchParams.get('state');

            if (!code || !state) {
                setStatus('error');
                setErrorMessage('Missing authorization code or state.');
                return;
            }

            try {
                // Call backend to exchange code for access token and save it
                const redirectUri = `${window.location.origin}/auth/meta/callback`;
                const response = await client.get('/auth/meta/callback', {
                    params: { code, state, redirectUri }
                });

                if (response.data.status === 'success') {
                    setStatus('success');
                    setTimeout(() => {
                        navigate('/whatsapp/meta-assets'); // We will create this page next
                    }, 2000);
                } else {
                    throw new Error(response.data.message || 'Meta authentication failed');
                }
            } catch (error: any) {
                console.error('Meta auth error:', error);
                setStatus('error');
                setErrorMessage(error.response?.data?.message || error.message || 'An error occurred during Meta authentication');
            }
        };

        handleCallback();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-md w-full text-center">
                {status === 'loading' && (
                    <div className="space-y-4">
                        <Spin size="large" />
                        <Title level={4} className="mt-4">Connecting to Meta</Title>
                        <Paragraph className="text-slate-500">Please wait while we securely link your account...</Paragraph>
                    </div>
                )}

                {status === 'success' && (
                    <Result
                        status="success"
                        title="Meta Account Linked Successfully!"
                        subTitle="You will be redirected momentarily."
                    />
                )}

                {status === 'error' && (
                    <Result
                        status="error"
                        title="Connection Failed"
                        subTitle={errorMessage}
                        extra={
                            <Button type="primary" onClick={() => navigate('/whatsapp')}>
                                Back to WhatsApp Dashboard
                            </Button>
                        }
                    />
                )}
            </div>
        </div>
    );
};

export default MetaAuthCallback;
