// WhatsAppAutomation.tsx — pure render shell.
// All logic lives in hooks/useAutomation.ts

import React from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, Card, Typography, Tag, Switch, Alert, Result } from 'antd';
import { EditOutlined, DeleteOutlined, ThunderboltOutlined, RobotOutlined } from '@ant-design/icons';
import { useAutomation } from '../hooks/useAutomation';
import AutomationFlowBuilder from './AutomationFlowBuilder';

const { Title, Text } = Typography;
const { Option } = Select;

const WhatsAppAutomation: React.FC = () => {
    const {
        form,
        isModalVisible, setIsModalVisible,
        editingRule,
        rules, isRulesLoading,
        isRuleSaving,
        handleEditRule, handleDeleteRule, handleSaveRule,
    } = useAutomation();

    /* ── Table column definitions (pure presentation config) ── */
    const ruleColumns = [
        { title: 'Rule Name', dataIndex: 'name', key: 'name', render: (text: string) => <Text strong>{text}</Text> },
        { title: 'Trigger', dataIndex: ['trigger', 'type'], key: 'trigger', render: (text: string) => <Tag color="blue">{text}</Tag> },
        { title: 'Action', key: 'action', render: (_: any, record: any) => <Tag color="green">{record.actions?.[0]?.type || 'NO ACTION'}</Tag> },
        { title: 'Status', dataIndex: 'isActive', key: 'isActive', render: (isActive: boolean) => <Tag color={isActive ? 'success' : 'default'}>{isActive ? 'ACTIVE' : 'INACTIVE'}</Tag> },
        {
            title: 'Actions', key: 'actions', render: (_: any, record: any) => (
                <Space>
                    <Button icon={<EditOutlined />} size="small" onClick={() => handleEditRule(record)} />
                    <Button icon={<DeleteOutlined />} size="small" danger onClick={() => handleDeleteRule(record.id)} />
                </Space>
            ),
        },
    ];

    /* ── Main view ── */
    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                    <Title level={4}><ThunderboltOutlined /> WhatsApp Automation</Title>
                    <Text type="secondary">Manage your AI Ecommerce Assistant and fallback rules</Text>
                </div>
            </div>

            <Card style={{ marginBottom: 24, background: '#f6ffed', borderColor: '#b7eb8f' }}>
                <Result
                    icon={<RobotOutlined style={{ color: '#52c41a' }} />}
                    title="AI Ecommerce Assistant is Active"
                    subTitle="Your WhatsApp channel is now fully automated with intelligent intent matching, dynamic product fetching, and cart management."
                    extra={
                        <Space>
                            <Tag color="green" style={{ padding: '4px 8px', fontSize: 14 }}>Status: Online & Handling Queries</Tag>
                        </Space>
                    }
                />
            </Card>

            <Alert
                message="Static Flows Disabled"
                description="The legacy visual flow builder has been replaced by the dynamic AI state engine. All incomings queries without active sessions are routed directly to the AI assistant."
                type="info"
                showIcon
                style={{ marginBottom: 24 }}
            />

            <div style={{ marginTop: 24 }}>
                <Title level={5}>Legacy Rules</Title>
                <Table columns={ruleColumns} dataSource={rules} rowKey="id" loading={isRulesLoading} pagination={{ pageSize: 5 }} />
            </div>

            <div style={{ marginTop: 24 }}>
                <AutomationFlowBuilder />
            </div>

            <Modal
                title={editingRule ? 'Edit Automation Rule' : 'Create Automation Rule'}
                open={isModalVisible}
                onOk={handleSaveRule}
                onCancel={() => setIsModalVisible(false)}
                width={700}
                confirmLoading={isRuleSaving}
            >
                <Form form={form} layout="vertical" initialValues={{ isActive: true, triggerType: 'MESSAGE_RECEIVED' }}>
                    <Form.Item name="name" label="Rule Name" rules={[{ required: true }]}>
                        <Input placeholder="e.g. Price Inquiry Auto-reply" />
                    </Form.Item>

                    <Form.Item name="isActive" label="Status" valuePropName="checked">
                        <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                    </Form.Item>

                    <Card size="small" title="Trigger" style={{ marginBottom: 16 }}>
                        <Form.Item name="triggerType" label="When this happens..." rules={[{ required: true }]}>
                            <Select>
                                <Option value="MESSAGE_RECEIVED">Message Received</Option>
                                <Option value="OPT_IN_STATUS_CHANGED">Opt-in Status Changed</Option>
                            </Select>
                        </Form.Item>
                    </Card>

                    <Card size="small" title="Conditions" style={{ marginBottom: 16 }}>
                        <Space style={{ display: 'flex', width: '100%' }} align="start">
                            <Form.Item name="conditionField" label="Field" style={{ width: 150 }} rules={[{ required: true }]}>
                                <Select>
                                    <Option value="message_body">Message Body</Option>
                                    <Option value="sender_phone">Sender Phone</Option>
                                    <Option value="contact_tag">Contact Tag</Option>
                                </Select>
                            </Form.Item>
                            <Form.Item name="conditionOperator" label="Operator" style={{ width: 120 }} rules={[{ required: true }]}>
                                <Select>
                                    <Option value="contains">Contains</Option>
                                    <Option value="equals">Equals</Option>
                                    <Option value="starts_with">Starts With</Option>
                                </Select>
                            </Form.Item>
                            <Form.Item name="conditionValue" label="Value" style={{ flex: 1 }} rules={[{ required: true }]}>
                                <Input placeholder="e.g. price" />
                            </Form.Item>
                        </Space>
                    </Card>

                    <Card size="small" title="Action" style={{ marginBottom: 16 }}>
                        <Form.Item name="actionType" label="Do this..." rules={[{ required: true }]}>
                            <Select>
                                <Option value="SEND_TEXT">Send Text Message</Option>
                                <Option value="SEND_TEMPLATE">Send Template</Option>
                                <Option value="ADD_TAG">Add Tag</Option>
                                <Option value="ASSIGN_AGENT">Assign Agent</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item noStyle shouldUpdate={(prev, current) => prev.actionType !== current.actionType}>
                            {({ getFieldValue }) => {
                                const actionType = getFieldValue('actionType');
                                if (actionType === 'SEND_TEXT') {
                                    return (
                                        <Form.Item name={['actionConfig', 'text']} label="Message Text" rules={[{ required: true }]}>
                                            <Input.TextArea rows={3} placeholder="Enter your auto-reply message..." />
                                        </Form.Item>
                                    );
                                }
                                if (actionType === 'SEND_TEMPLATE') {
                                    return (
                                        <Form.Item name={['actionConfig', 'templateName']} label="Template Name" rules={[{ required: true }]}>
                                            <Input placeholder="e.g. welcome_message" />
                                        </Form.Item>
                                    );
                                }
                                if (actionType === 'ADD_TAG') {
                                    return (
                                        <Form.Item name={['actionConfig', 'tag']} label="Tag Name" rules={[{ required: true }]}>
                                            <Input placeholder="e.g. hot_lead" />
                                        </Form.Item>
                                    );
                                }
                                if (actionType === 'ASSIGN_AGENT') {
                                    const AGENTS = ['Meera Joshi', 'Arjun Das', 'Riya Sharma', 'Kabir Anand'];
                                    return (
                                        <Form.Item name={['actionConfig', 'agentId']} label="Select Agent" rules={[{ required: true }]}>
                                            <Select placeholder="Choose an agent...">
                                                {AGENTS.map(agent => (
                                                    <Option key={agent} value={agent}>{agent}</Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    );
                                }
                                return null;
                            }}
                        </Form.Item>
                    </Card>
                </Form>
            </Modal>
        </div>
    );
};

export default WhatsAppAutomation;
