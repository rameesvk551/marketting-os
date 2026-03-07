import React, { useState, useEffect } from 'react';
import { Card, List, Button, Input, Modal, message, Typography, Tabs } from 'antd';
import { DeleteOutlined, MessageOutlined, SendOutlined } from '@ant-design/icons';
import { instagramApi } from '../api/instagramApi';

const { Text } = Typography;

const SocialInbox: React.FC = () => {
    const [comments, setComments] = useState<any[]>([]);
    const [messagesList, setMessagesList] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [replyingTo, setReplyingTo] = useState<any | null>(null);
    const [isPrivateReply, setIsPrivateReply] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [activeTab, setActiveTab] = useState('comments');

    useEffect(() => {
        fetchInbox();
    }, [activeTab]);

    const fetchInbox = async () => {
        setLoading(true);
        try {
            if (activeTab === 'comments') {
                const res = await instagramApi.getComments();
                setComments(res.data || []);
            } else {
                const res = await instagramApi.getMessages();
                setMessagesList(res.data || []);
            }
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to fetch inbox items');
        } finally {
            setLoading(false);
        }
    };

    const handleReplyComment = async () => {
        if (!replyText.trim() || !replyingTo) return;
        try {
            if (isPrivateReply) {
                await instagramApi.privateReplyToComment(replyingTo.accountId, replyingTo.igCommentId, replyText);
                message.success('Private reply sent via DM');
            } else {
                await instagramApi.replyToComment(replyingTo.accountId, replyingTo.igCommentId, replyText);
                message.success('Reply sent successfully');
            }
            setReplyingTo(null);
            setReplyText('');
            setIsPrivateReply(false);
            // Optially refetch, but meta syncs it via webhook anyway.
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to reply');
        }
    };

    const handleDeleteComment = async (comment: any) => {
        try {
            await instagramApi.deleteComment(comment.accountId, comment.igCommentId);
            message.success('Comment deleted');
            setComments(comments.filter(c => c.id !== comment.id));
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to delete comment');
        }
    };

    const handleSendMessage = async (msg: any) => {
        const text = prompt('Enter your reply:');
        if (!text) return;

        try {
            await instagramApi.sendMessage(msg.accountId, msg.senderId, text);
            message.success('Message sent!');
            fetchInbox();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to send message');
        }
    };

    const renderComments = () => (
        <List
            loading={loading}
            dataSource={comments}
            renderItem={(item) => (
                <List.Item
                    actions={[
                        <Button
                            type="text"
                            icon={<MessageOutlined />}
                            onClick={() => { setReplyingTo(item); setIsPrivateReply(false); }}
                        >
                            Reply
                        </Button>,
                        <Button
                            type="text"
                            icon={<SendOutlined />}
                            onClick={() => { setReplyingTo(item); setIsPrivateReply(true); }}
                        >
                            DM Reply
                        </Button>,
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeleteComment(item)}
                        >
                            Delete
                        </Button>
                    ]}
                >
                    <List.Item.Meta
                        title={<Text strong>@{item.fromUsername}</Text>}
                        description={item.text}
                    />
                    <div style={{ fontSize: '12px', color: '#999' }}>
                        {new Date(item.timestamp).toLocaleString()}
                        {item.isHidden && <span style={{ marginLeft: 8, color: 'red' }}>(Hidden)</span>}
                    </div>
                </List.Item>
            )}
        />
    );

    const renderMessages = () => (
        <List
            loading={loading}
            dataSource={messagesList}
            renderItem={(item) => (
                <List.Item
                    actions={
                        !item.isEcho ? [
                            <Button
                                type="primary"
                                icon={<SendOutlined />}
                                onClick={() => handleSendMessage(item)}
                            >
                                Reply
                            </Button>
                        ] : []
                    }
                >
                    <List.Item.Meta
                        title={<Text strong>{item.isEcho ? 'You (Business)' : 'User ' + item.senderId}</Text>}
                        description={item.text || '[Media Attachment]'}
                    />
                    <div style={{ fontSize: '12px', color: '#999' }}>
                        {new Date(item.timestamp).toLocaleString()}
                    </div>
                </List.Item>
            )}
        />
    );

    return (
        <Card title="Social Inbox" bordered={false}>
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                    { key: 'comments', label: 'Comments', children: renderComments() },
                    { key: 'messages', label: 'Direct Messages', children: renderMessages() }
                ]}
            />
            <Modal
                title={isPrivateReply ? `Private Message to @${replyingTo?.fromUsername}` : `Reply to @${replyingTo?.fromUsername}`}
                open={!!replyingTo}
                onCancel={() => {
                    setReplyingTo(null);
                    setReplyText('');
                    setIsPrivateReply(false);
                }}
                onOk={handleReplyComment}
                okText="Send"
            >
                <div style={{ marginBottom: 16 }}>
                    <Text type="secondary">"{replyingTo?.text}"</Text>
                </div>
                <Input.TextArea
                    rows={4}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your reply here..."
                />
            </Modal>
        </Card>
    );
};

export default SocialInbox;
