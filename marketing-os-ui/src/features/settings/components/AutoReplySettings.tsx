import React from 'react';
import { Form, Input, Switch, TimePicker, Row, Col, Card, Typography, Button, Space, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface AutoReplySettingsProps {
    initialValues?: any;
    onSubmit: (values: any) => Promise<any>;
    isSubmitting: boolean;
}

const daysOfWeek = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];

export const AutoReplySettings: React.FC<AutoReplySettingsProps> = ({
    initialValues,
    onSubmit,
    isSubmitting
}) => {
    const [form] = Form.useForm();

    const handleFinish = async (values: any) => {
        // Format business hours output
        const formattedHours = daysOfWeek.reduce((acc: any, day) => {
            const open = values[`${day}_open`];
            const start = values[`${day}_start`];
            const end = values[`${day}_end`];

            acc[day] = {
                open: !!open,
                start: start ? start.format('HH:mm') : '09:00',
                end: end ? end.format('HH:mm') : '17:00'
            };
            return acc;
        }, {});

        try {
            await onSubmit({
                autoGreetingMessage: values.autoGreetingMessage,
                awayMessage: values.awayMessage,
                businessHours: formattedHours
            });
            message.success('Auto-reply settings saved successfully');
        } catch (err: any) {
            message.error(err.message || 'Failed to save settings');
        }
    };

    // Convert incoming businessHours text to moment/dayjs objects for TimePicker
    const initialFormValues = {
        autoGreetingMessage: initialValues?.autoGreetingMessage || '',
        awayMessage: initialValues?.awayMessage || '',
    };

    daysOfWeek.forEach(day => {
        const dayConfig = initialValues?.businessHours?.[day] || { open: true, start: '09:00', end: '17:00' };
        (initialFormValues as any)[`${day}_open`] = dayConfig.open;
        (initialFormValues as any)[`${day}_start`] = dayjs(dayConfig.start || '09:00', 'HH:mm');
        (initialFormValues as any)[`${day}_end`] = dayjs(dayConfig.end || '17:00', 'HH:mm');
    });

    return (
        <Card bordered={false}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                <div>
                    <Title level={4}>Auto Greeting & Away Messages</Title>
                    <Text type="secondary">
                        Configure what customers receive automatically when they first message you or outside business hours.
                    </Text>
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleFinish}
                    initialValues={initialFormValues}
                >
                    <Form.Item name="autoGreetingMessage" label="Auto Greeting Message" extra="Sent when a customer messages you for the first time.">
                        <TextArea rows={4} placeholder="Hello! Welcome to our store. How can we help you today?" />
                    </Form.Item>

                    <Form.Item name="awayMessage" label="Away Message" extra="Sent if a customer messages you outside of business hours.">
                        <TextArea rows={4} placeholder="Thanks for reaching out! We are currently closed. We'll get back to you as soon as possible." />
                    </Form.Item>

                    <Title level={5} style={{ marginTop: 24, marginBottom: 16 }}>Business Hours</Title>

                    {daysOfWeek.map(day => (
                        <Row key={day} gutter={16} align="middle" style={{ marginBottom: 12 }}>
                            <Col span={4}>
                                <Text strong style={{ textTransform: 'capitalize' }}>{day}</Text>
                            </Col>
                            <Col span={4}>
                                <Form.Item name={`${day}_open`} valuePropName="checked" noStyle>
                                    <Switch checkedChildren="Open" unCheckedChildren="Closed" />
                                </Form.Item>
                            </Col>

                            {/* Need to watch the switch state to enable/disable TimePickers */}
                            <Form.Item noStyle shouldUpdate={(prev, current) => prev[`${day}_open`] !== current[`${day}_open`]}>
                                {({ getFieldValue }) => {
                                    const isOpen = getFieldValue(`${day}_open`);
                                    return (
                                        <>
                                            <Col span={6}>
                                                <Form.Item name={`${day}_start`} noStyle rules={[{ required: isOpen, message: 'Start time required' }]}>
                                                    <TimePicker format="HH:mm" disabled={!isOpen} />
                                                </Form.Item>
                                            </Col>
                                            <Col span={2} style={{ textAlign: 'center' }}>
                                                <Text>to</Text>
                                            </Col>
                                            <Col span={6}>
                                                <Form.Item name={`${day}_end`} noStyle rules={[{ required: isOpen, message: 'End time required' }]}>
                                                    <TimePicker format="HH:mm" disabled={!isOpen} />
                                                </Form.Item>
                                            </Col>
                                        </>
                                    );
                                }}
                            </Form.Item>
                        </Row>
                    ))}

                    <Form.Item style={{ marginTop: 24 }}>
                        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={isSubmitting}>
                            Save Auto-Reply Settings
                        </Button>
                    </Form.Item>
                </Form>
            </Space>
        </Card>
    );
};
