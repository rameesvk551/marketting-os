import React from 'react';
import { Card, Typography, Tag, Row, Col, Empty, Button, Spin, Tooltip, Segmented } from 'antd';
import {
    PictureOutlined,
    HeartOutlined,
    MessageOutlined,
    EyeOutlined,
    ReloadOutlined,
    LinkOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    PlayCircleOutlined,
    AppstoreOutlined,
    CloudSyncOutlined,
    FilterOutlined,
    SyncOutlined,
} from '@ant-design/icons';
import { useInstagramAuth } from '../hooks/useInstagramAuth';
import { useContentPublish } from '../hooks/useContentPublish';

const { Text, Title } = Typography;

const IG_GRADIENT = 'linear-gradient(135deg, #833AB4 0%, #FD1D1D 50%, #F77737 100%)';

const statusConfig: Record<string, { color: string; icon: React.ReactNode; bg: string }> = {
    published: { color: '#22c55e', icon: <CheckCircleOutlined />, bg: '#f0fdf4' },
    processing: { color: '#3b82f6', icon: <SyncOutlined spin />, bg: '#eff6ff' },
    pending: { color: '#f59e0b', icon: <ClockCircleOutlined />, bg: '#fffbeb' },
    failed: { color: '#ef4444', icon: <ExclamationCircleOutlined />, bg: '#fef2f2' },
    scheduled: { color: '#8b5cf6', icon: <ClockCircleOutlined />, bg: '#f5f3ff' },
};

const typeIcons: Record<string, { icon: React.ReactNode; label: string }> = {
    IMAGE: { icon: <PictureOutlined />, label: 'Photo' },
    VIDEO: { icon: <PlayCircleOutlined />, label: 'Video' },
    REELS: { icon: <PlayCircleOutlined />, label: 'Reel' },
    CAROUSEL: { icon: <AppstoreOutlined />, label: 'Carousel' },
    STORY: { icon: <EyeOutlined />, label: 'Story' },
};

const MediaLibrary: React.FC = () => {
    const { isConnected, accounts } = useInstagramAuth();
    const accountId = accounts[0]?.id;
    const { media, isLoadingMedia, totalMedia, syncMedia, isSyncing, refetchMedia } = useContentPublish(accountId);
    const [filter, setFilter] = React.useState<string>('all');

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
                <Text type="secondary">Link your Instagram Business account to manage your media library.</Text>
            </div>
        );
    }

    const filteredMedia = filter === 'all'
        ? media
        : media.filter((item: any) => item.status === filter || item.mediaType === filter);

    return (
        <div>
            {/* ── Header ── */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 24, flexWrap: 'wrap', gap: 12,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: IG_GRADIENT,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(131,58,180,0.25)',
                    }}>
                        <PictureOutlined style={{ color: '#fff', fontSize: 18 }} />
                    </div>
                    <div>
                        <Title level={5} style={{ margin: 0, fontWeight: 700 }}>
                            Media Library
                        </Title>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {totalMedia} total posts tracked
                        </Text>
                    </div>
                </div>
                <Space size={8}>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => refetchMedia()}
                        style={{ borderRadius: 10, fontWeight: 500 }}
                    >
                        Refresh
                    </Button>
                    <Button
                        icon={<CloudSyncOutlined spin={isSyncing} />}
                        onClick={() => accountId && syncMedia(accountId)}
                        loading={isSyncing}
                        type="primary"
                        style={{
                            borderRadius: 10,
                            background: IG_GRADIENT,
                            border: 'none',
                            fontWeight: 600,
                            boxShadow: '0 4px 14px rgba(131,58,180,0.25)',
                        }}
                    >
                        Sync from Instagram
                    </Button>
                </Space>
            </div>

            {/* ── Filters ── */}
            <div style={{ marginBottom: 20 }}>
                <Segmented
                    value={filter}
                    onChange={(val) => setFilter(val as string)}
                    options={[
                        { label: 'All', value: 'all' },
                        { label: '✅ Published', value: 'published' },
                        { label: '⏳ Pending', value: 'pending' },
                        { label: '❌ Failed', value: 'failed' },
                    ]}
                    style={{ borderRadius: 10, fontWeight: 500 }}
                />
            </div>

            {/* ── Loading ── */}
            {isLoadingMedia && (
                <div style={{ textAlign: 'center', padding: 80 }}>
                    <Spin size="large" />
                    <Text style={{ display: 'block', marginTop: 16, color: '#94a3b8' }}>
                        Loading media...
                    </Text>
                </div>
            )}

            {/* ── Empty State ── */}
            {!isLoadingMedia && filteredMedia.length === 0 && (
                <Card
                    style={{
                        borderRadius: 20, border: 'none',
                        boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
                        textAlign: 'center', padding: '40px 0',
                    }}
                >
                    <div style={{
                        width: 88, height: 88, borderRadius: 24,
                        background: 'linear-gradient(135deg, #faf5ff, #fff1f2, #fff7ed)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 20px',
                    }}>
                        <PictureOutlined style={{ fontSize: 36, color: '#a78bfa' }} />
                    </div>
                    <Title level={4} style={{ color: '#475569', fontWeight: 600, marginBottom: 8 }}>
                        No media {filter !== 'all' ? `with status "${filter}"` : 'yet'}
                    </Title>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 24, fontSize: 14 }}>
                        Publish your first post or sync existing ones from Instagram.
                    </Text>
                    <Button
                        type="primary"
                        icon={<CloudSyncOutlined />}
                        onClick={() => accountId && syncMedia(accountId)}
                        loading={isSyncing}
                        size="large"
                        style={{
                            borderRadius: 12,
                            background: IG_GRADIENT,
                            border: 'none',
                            fontWeight: 600,
                            height: 46,
                            padding: '0 32px',
                        }}
                    >
                        Sync from Instagram
                    </Button>
                </Card>
            )}

            {/* ── Media Grid ── */}
            {!isLoadingMedia && filteredMedia.length > 0 && (
                <Row gutter={[16, 16]}>
                    {filteredMedia.map((item: any) => {
                        const status = statusConfig[item.status] || statusConfig.pending;
                        const type = typeIcons[item.mediaType] || typeIcons.IMAGE;

                        return (
                            <Col xs={12} sm={8} md={6} key={item.id}>
                                <Card
                                    hoverable
                                    style={{
                                        borderRadius: 16,
                                        overflow: 'hidden',
                                        border: 'none',
                                        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                                        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                                    }}
                                    bodyStyle={{ padding: '14px 16px' }}
                                    cover={
                                        <div style={{
                                            aspectRatio: '1',
                                            background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden',
                                            position: 'relative',
                                        }}>
                                            {item.mediaUrl ? (
                                                <img
                                                    src={item.mediaUrl}
                                                    alt={item.caption || 'Media'}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <PictureOutlined style={{ fontSize: 36, color: '#cbd5e1' }} />
                                            )}

                                            {/* Hover overlay with engagement */}
                                            <div style={{
                                                position: 'absolute', inset: 0,
                                                background: 'rgba(0,0,0,0.45)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                gap: 24, opacity: 0,
                                                transition: 'opacity 0.2s ease',
                                                color: '#fff', fontSize: 15, fontWeight: 700,
                                            }}
                                                className="media-hover-overlay"
                                            >
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <HeartOutlined /> {item.likeCount || 0}
                                                </span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <MessageOutlined /> {item.commentsCount || 0}
                                                </span>
                                            </div>

                                            {/* Type badge — top left */}
                                            <div style={{
                                                position: 'absolute', top: 10, left: 10,
                                                background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
                                                borderRadius: 8, padding: '3px 10px',
                                                color: '#fff', fontSize: 11, fontWeight: 600,
                                                display: 'flex', alignItems: 'center', gap: 4,
                                            }}>
                                                {type.icon} {type.label}
                                            </div>

                                            {/* Status badge — top right */}
                                            <div style={{
                                                position: 'absolute', top: 10, right: 10,
                                                background: status.bg, backdropFilter: 'blur(8px)',
                                                borderRadius: 8, padding: '3px 10px',
                                                color: status.color, fontSize: 11, fontWeight: 600,
                                                display: 'flex', alignItems: 'center', gap: 4,
                                                border: `1px solid ${status.color}20`,
                                            }}>
                                                {status.icon} {item.status}
                                            </div>
                                        </div>
                                    }
                                >
                                    {/* Caption */}
                                    <Text
                                        ellipsis={{ tooltip: item.caption }}
                                        style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 10, lineHeight: 1.5 }}
                                    >
                                        {item.caption || 'No caption'}
                                    </Text>

                                    {/* Stats row */}
                                    <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                            <HeartOutlined /> {item.likeCount || 0}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                            <MessageOutlined /> {item.commentsCount || 0}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                            <EyeOutlined /> {item.impressions || 0}
                                        </span>
                                    </div>

                                    {/* Instagram link */}
                                    {item.permalink && (
                                        <a
                                            href={item.permalink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                fontSize: 11, marginTop: 10, display: 'flex',
                                                alignItems: 'center', gap: 4, color: '#833AB4',
                                                fontWeight: 500,
                                            }}
                                        >
                                            <LinkOutlined /> View on Instagram
                                        </a>
                                    )}
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            )}

            {/* ── Hover effect styles ── */}
            <style>{`
                .ant-card-hoverable:hover {
                    transform: translateY(-4px) !important;
                    box-shadow: 0 8px 28px rgba(131,58,180,0.12) !important;
                }
                .ant-card-hoverable:hover .media-hover-overlay {
                    opacity: 1 !important;
                }
            `}</style>
        </div>
    );
};

export default MediaLibrary;
