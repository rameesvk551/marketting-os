import React, { useState } from 'react';
import { Card, Input, Button, Typography, Space, Tag, Alert, Divider, Row, Col, Tooltip, Switch } from 'antd';
import {
    SendOutlined,
    PictureOutlined,
    InfoCircleOutlined,
    EyeOutlined,
    FileImageOutlined,
    SmileOutlined,
    NumberOutlined,
    BoldOutlined,
} from '@ant-design/icons';
import { useInstagramAuth } from '../hooks/useInstagramAuth';
import { useContentPublish } from '../hooks/useContentPublish';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

const IG_GRADIENT = 'linear-gradient(135deg, #833AB4 0%, #FD1D1D 50%, #F77737 100%)';

const PostComposer: React.FC = () => {
    const { isConnected, accounts } = useInstagramAuth();
    const accountId = accounts[0]?.id;
    const { publishImage, isPublishing, publishingLimit } = useContentPublish(accountId);

    const [imageUrl, setImageUrl] = useState('');
    const [caption, setCaption] = useState('');
    const [altText, setAltText] = useState('');

    const handlePublish = () => {
        if (!accountId || !imageUrl) return;
        publishImage({
            accountId,
            imageUrl,
            caption: caption || undefined,
            altText: altText || undefined,
        });
    };

    if (!isConnected) {
        return (
            <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center' }}>
                <div style={{
                    width: 80, height: 80, borderRadius: 20, background: '#f8fafc',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px', border: '2px dashed #e2e8f0',
                }}>
                    <PictureOutlined style={{ fontSize: 32, color: '#94a3b8' }} />
                </div>
                <Title level={4} style={{ color: '#475569', fontWeight: 600 }}>Connect an Account First</Title>
                <Text type="secondary" style={{ fontSize: 14 }}>
                    Head to the Overview tab and link your Instagram Business account to start publishing.
                </Text>
            </div>
        );
    }

    const captionLength = caption.length;
    const maxCaption = 2200;
    const captionProgress = (captionLength / maxCaption) * 100;

    return (
        <Row gutter={[24, 24]}>
            {/* ── Composer Form ── */}
            <Col xs={24} lg={14}>
                <Card
                    style={{
                        borderRadius: 20,
                        border: 'none',
                        boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
                    }}
                    bodyStyle={{ padding: '28px 28px' }}
                >
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 12,
                            background: IG_GRADIENT,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(131,58,180,0.25)',
                        }}>
                            <FileImageOutlined style={{ color: '#fff', fontSize: 18 }} />
                        </div>
                        <div>
                            <Title level={5} style={{ margin: 0, fontWeight: 700 }}>Create New Post</Title>
                            <Text type="secondary" style={{ fontSize: 12 }}>Publishing as @{accounts[0]?.username}</Text>
                        </div>
                    </div>

                    <Space direction="vertical" style={{ width: '100%' }} size={20}>
                        {/* Image URL */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <Text strong style={{ fontSize: 13 }}>Image URL</Text>
                                <Tag style={{ borderRadius: 6, fontSize: 10, fontWeight: 600, background: '#fef2f2', color: '#ef4444', border: 'none' }}>Required</Tag>
                            </div>
                            <Input
                                placeholder="https://example.com/your-image.jpg"
                                value={imageUrl}
                                onChange={e => setImageUrl(e.target.value)}
                                prefix={<PictureOutlined style={{ color: '#94A3B8' }} />}
                                style={{
                                    borderRadius: 12, height: 46,
                                    border: '2px solid #e5e7eb',
                                    transition: 'border-color 0.2s',
                                }}
                                size="large"
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                                <InfoCircleOutlined style={{ fontSize: 11, color: '#94a3b8' }} />
                                <Text type="secondary" style={{ fontSize: 11 }}>Must be a publicly accessible URL (Meta fetches it via cURL)</Text>
                            </div>
                        </div>

                        {/* Caption */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <Text strong style={{ fontSize: 13 }}>Caption</Text>
                                <Text
                                    type={captionLength > 2000 ? 'danger' : 'secondary'}
                                    style={{ fontSize: 11, fontWeight: 500, fontFamily: 'monospace' }}
                                >
                                    {captionLength.toLocaleString()} / {maxCaption.toLocaleString()}
                                </Text>
                            </div>
                            <TextArea
                                placeholder="Write your caption here... Use #hashtags and @mentions for better reach ✨"
                                value={caption}
                                onChange={e => setCaption(e.target.value)}
                                rows={6}
                                maxLength={maxCaption}
                                style={{
                                    borderRadius: 12, resize: 'none',
                                    border: '2px solid #e5e7eb',
                                    fontSize: 14, lineHeight: 1.6,
                                }}
                                showCount={false}
                            />
                            {/* Character progress bar */}
                            <div style={{
                                height: 3, borderRadius: 2, background: '#f1f5f9', marginTop: 8,
                                overflow: 'hidden',
                            }}>
                                <div style={{
                                    height: '100%', borderRadius: 2,
                                    width: `${Math.min(captionProgress, 100)}%`,
                                    background: captionProgress > 90 ? '#ef4444' : captionProgress > 70 ? '#f59e0b' : IG_GRADIENT,
                                    transition: 'width 0.2s ease, background 0.2s ease',
                                }} />
                            </div>

                            {/* Quick toolbar */}
                            <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                                {[
                                    { icon: <SmileOutlined />, tip: 'Emoji' },
                                    { icon: <NumberOutlined />, tip: 'Hashtag' },
                                ].map((btn, i) => (
                                    <Tooltip key={i} title={btn.tip}>
                                        <Button
                                            type="text"
                                            icon={btn.icon}
                                            size="small"
                                            style={{ color: '#94a3b8', borderRadius: 8 }}
                                        />
                                    </Tooltip>
                                ))}
                            </div>
                        </div>

                        {/* Alt Text */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <Text strong style={{ fontSize: 13 }}>Alt Text</Text>
                                <Tag style={{ borderRadius: 6, fontSize: 10, fontWeight: 600, background: '#eff6ff', color: '#3b82f6', border: 'none' }}>Accessibility</Tag>
                            </div>
                            <Input
                                placeholder="Describe the image for screen readers..."
                                value={altText}
                                onChange={e => setAltText(e.target.value)}
                                style={{ borderRadius: 12, border: '2px solid #e5e7eb', height: 42 }}
                            />
                        </div>

                        <Divider style={{ margin: '4px 0' }} />

                        {/* Publishing Limit */}
                        {publishingLimit && (
                            <div style={{
                                padding: '14px 18px', borderRadius: 14,
                                background: publishingLimit.remaining > 10 ? '#f0fdf4' : '#fef2f2',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            }}>
                                <Text style={{ fontSize: 13, color: publishingLimit.remaining > 10 ? '#166534' : '#991b1b' }}>
                                    📊 Publishing limit: <strong>{publishingLimit.used}</strong>/{publishingLimit.total} used
                                </Text>
                                <Tag
                                    color={publishingLimit.remaining > 10 ? 'green' : 'red'}
                                    style={{ borderRadius: 20, fontWeight: 600, margin: 0 }}
                                >
                                    {publishingLimit.remaining} left
                                </Tag>
                            </div>
                        )}

                        {/* Publish Button */}
                        <Button
                            type="primary"
                            icon={<SendOutlined />}
                            size="large"
                            block
                            onClick={handlePublish}
                            loading={isPublishing}
                            disabled={!imageUrl.trim()}
                            style={{
                                borderRadius: 14,
                                height: 54,
                                fontWeight: 700,
                                fontSize: 16,
                                background: !imageUrl.trim() ? undefined : IG_GRADIENT,
                                border: 'none',
                                boxShadow: imageUrl.trim() ? '0 6px 24px rgba(131,58,180,0.30)' : undefined,
                                letterSpacing: '0.3px',
                            }}
                        >
                            {isPublishing ? 'Publishing to Instagram...' : 'Publish Now'}
                        </Button>
                    </Space>
                </Card>
            </Col>

            {/* ── Live Preview ── */}
            <Col xs={24} lg={10}>
                <div style={{ position: 'sticky', top: 24 }}>
                    <Card
                        style={{
                            borderRadius: 20,
                            border: 'none',
                            boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
                            overflow: 'hidden',
                        }}
                        bodyStyle={{ padding: 0 }}
                    >
                        {/* Preview header */}
                        <div style={{
                            padding: '14px 20px',
                            display: 'flex', alignItems: 'center', gap: 8,
                            borderBottom: '1px solid #f1f5f9',
                        }}>
                            <EyeOutlined style={{ color: '#833AB4' }} />
                            <Text strong style={{ fontSize: 13, color: '#475569' }}>Live Preview</Text>
                        </div>

                        {/* Instagram post mockup */}
                        <div style={{ background: '#fff' }}>
                            {/* Post header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px' }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: '50%',
                                    background: IG_GRADIENT,
                                    padding: 2,
                                }}>
                                    <div style={{
                                        width: '100%', height: '100%', borderRadius: '50%',
                                        background: '#fff', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <Text style={{ fontSize: 11, fontWeight: 800, color: '#833AB4' }}>
                                            {accounts[0]?.username?.charAt(0).toUpperCase() || 'I'}
                                        </Text>
                                    </div>
                                </div>
                                <div>
                                    <Text strong style={{ fontSize: 13, display: 'block', lineHeight: 1.2 }}>
                                        {accounts[0]?.username || 'your_account'}
                                    </Text>
                                    <Text type="secondary" style={{ fontSize: 10 }}>Just now</Text>
                                </div>
                            </div>

                            {/* Image area */}
                            <div style={{
                                width: '100%', aspectRatio: '1',
                                background: imageUrl
                                    ? undefined
                                    : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                overflow: 'hidden', position: 'relative',
                            }}>
                                {imageUrl ? (
                                    <img
                                        src={imageUrl}
                                        alt={altText || 'Preview'}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        onError={e => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            (e.target as HTMLImageElement).nextElementSibling?.removeAttribute('style');
                                        }}
                                    />
                                ) : null}
                                {!imageUrl && (
                                    <div style={{ textAlign: 'center', padding: 40 }}>
                                        <div style={{
                                            width: 64, height: 64, borderRadius: 20,
                                            background: '#e2e8f0', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center',
                                            margin: '0 auto 12px',
                                        }}>
                                            <PictureOutlined style={{ fontSize: 28, color: '#94a3b8' }} />
                                        </div>
                                        <Text type="secondary" style={{ fontSize: 13 }}>
                                            Enter an image URL to see a preview
                                        </Text>
                                    </div>
                                )}
                            </div>

                            {/* Interaction icons */}
                            <div style={{ padding: '12px 16px', display: 'flex', gap: 16 }}>
                                <span style={{ fontSize: 22 }}>♡</span>
                                <span style={{ fontSize: 22 }}>💬</span>
                                <span style={{ fontSize: 22 }}>↗</span>
                                <span style={{ fontSize: 22, marginLeft: 'auto' }}>☆</span>
                            </div>

                            {/* Caption preview */}
                            <div style={{ padding: '0 16px 16px' }}>
                                {caption ? (
                                    <Text style={{ fontSize: 13, lineHeight: 1.6, wordBreak: 'break-word' }}>
                                        <strong>{accounts[0]?.username || 'your_account'}</strong>{' '}
                                        {caption.length > 150 ? caption.substring(0, 150) + '...' : caption}
                                    </Text>
                                ) : (
                                    <Text type="secondary" style={{ fontSize: 13, fontStyle: 'italic' }}>
                                        Your caption appears here...
                                    </Text>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            </Col>
        </Row>
    );
};

export default PostComposer;
