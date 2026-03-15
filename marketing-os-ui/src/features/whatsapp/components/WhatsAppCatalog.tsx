import React, { useState } from 'react';
import {
    Card, Typography, Switch, Form, Input, Button, Select, Space, Tabs,
    Divider, Modal, InputNumber, Alert, Row, Col, Statistic
} from 'antd';
import {
    ShoppingCartOutlined, ShopOutlined, SendOutlined, PlusOutlined,
    AppstoreOutlined, FileTextOutlined, TagsOutlined,
    SyncOutlined, CloudSyncOutlined, HistoryOutlined
} from '@ant-design/icons';
import { useCatalog } from '../hooks/useCatalog';
import { useCatalogConfig, useSyncLogs, useSyncAllProducts } from '../../catalog/hooks/useCatalog';
import CatalogConnectionCard from '../../catalog/components/CatalogConnectionCard';
import SyncHistoryTable from '../../catalog/components/SyncHistoryTable';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const WhatsAppCatalog: React.FC = () => {
    const {
        commerceSettings, settingsLoading, updateCommerceSettings,
        sending,
        createCatalogTemplate, sendCatalogTemplate,
        sendCatalogMessage, sendSingleProduct,
        sendMultiProduct,
    } = useCatalog();

    // Catalog syncing hooks
    const { data: configData, isLoading: configLoading } = useCatalogConfig();
    const { data: logsData, isLoading: logsLoading } = useSyncLogs(20);
    const syncAllMutation = useSyncAllProducts();

    const config = configData?.data;
    const logs = logsData?.data || [];
    const isConnected = config?.connectionStatus === 'active';

    // Compute stats from logs
    const lastSync = logs[0];
    const totalSynced = logs.reduce((acc: number, log: any) => acc + (log.syncedCount || 0), 0);
    const totalFailed = logs.reduce((acc: number, log: any) => acc + (log.failedCount || 0), 0);

    const [catalogTemplateForm] = Form.useForm();
    const [sendTemplateForm] = Form.useForm();
    const [catalogMsgForm] = Form.useForm();
    const [singleProductForm] = Form.useForm();
    const [multiProductForm] = Form.useForm();

    const [templateModal, setTemplateModal] = useState(false);
    const [sendTemplateModal, setSendTemplateModal] = useState(false);
    const [catalogMsgModal, setCatalogMsgModal] = useState(false);
    const [singleProductModal, setSingleProductModal] = useState(false);
    const [multiProductModal, setMultiProductModal] = useState(false);

    // Track variable count for template body
    const [varCount, setVarCount] = useState(0);

    // ── Handlers ──

    const handleCreateTemplate = async (values: any) => {
        const bodyExamples = [];
        for (let i = 1; i <= varCount; i++) {
            if (values[`example_${i}`]) bodyExamples.push(values[`example_${i}`]);
        }
        await createCatalogTemplate({
            name: values.name,
            language: values.language || 'en_US',
            bodyText: values.bodyText,
            bodyExamples: bodyExamples.length > 0 ? bodyExamples : undefined,
            footerText: values.footerText,
        });
        setTemplateModal(false);
        catalogTemplateForm.resetFields();
        setVarCount(0);
    };

    const handleSendTemplate = async (values: any) => {
        const bodyParams = [];
        for (let i = 0; i < (values.paramCount || 0); i++) {
            if (values[`param_${i}`]) bodyParams.push({ type: 'text', text: values[`param_${i}`] });
        }
        await sendCatalogTemplate({
            recipientPhone: values.recipientPhone,
            templateName: values.templateName,
            language: values.language || 'en_US',
            bodyParams: bodyParams.length > 0 ? bodyParams : undefined,
            thumbnailProductRetailerId: values.thumbnailProductRetailerId,
        });
        setSendTemplateModal(false);
        sendTemplateForm.resetFields();
    };

    const handleSendCatalogMsg = async (values: any) => {
        await sendCatalogMessage({
            recipientPhone: values.recipientPhone,
            bodyText: values.bodyText,
            footerText: values.footerText,
            thumbnailProductRetailerId: values.thumbnailProductRetailerId,
        });
        setCatalogMsgModal(false);
        catalogMsgForm.resetFields();
    };

    const handleSendSingleProduct = async (values: any) => {
        await sendSingleProduct({
            recipientPhone: values.recipientPhone,
            catalogId: values.catalogId,
            productRetailerId: values.productRetailerId,
            bodyText: values.bodyText,
            footerText: values.footerText,
        });
        setSingleProductModal(false);
        singleProductForm.resetFields();
    };

    const handleSendMultiProduct = async (values: any) => {
        const sections = (values.sections || []).map((s: any) => ({
            title: s.title,
            productRetailerIds: (s.productRetailerIds || '').split(',').map((id: string) => id.trim()).filter(Boolean),
        }));
        await sendMultiProduct({
            recipientPhone: values.recipientPhone,
            catalogId: values.catalogId,
            headerText: values.headerText,
            bodyText: values.bodyText,
            footerText: values.footerText,
            sections,
        });
        setMultiProductModal(false);
        multiProductForm.resetFields();
    };

    // Count {{n}} variables in body text
    const countVariables = (text: string) => {
        const matches = text.match(/\{\{\d+\}\}/g);
        return matches ? matches.length : 0;
    };

    return (
        <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 24 }}>
                <Title level={4}><ShopOutlined /> WhatsApp Catalog & Commerce</Title>
                <Text type="secondary">
                    Send catalog messages, product messages, and manage commerce settings.
                    Based on the Meta WhatsApp Business API Commerce features.
                </Text>
            </div>

            <Tabs defaultActiveKey="settings" items={[
                {
                    key: 'settings',
                    label: <><ShoppingCartOutlined /> Commerce Settings</>,
                    children: (
                        <Row gutter={[24, 24]}>
                            <Col xs={24} md={12}>
                                <Card title="Shopping Cart" bordered>
                                    <Paragraph>Enable or disable the shopping cart for your WhatsApp Business phone number.</Paragraph>
                                    <Space>
                                        <Text>Cart Enabled:</Text>
                                        <Switch
                                            checked={commerceSettings?.is_cart_enabled ?? true}
                                            loading={settingsLoading}
                                            onChange={(checked) => updateCommerceSettings({ isCartEnabled: checked })}
                                        />
                                    </Space>
                                    <Paragraph type="secondary" style={{ marginTop: 8, fontSize: 12 }}>
                                        When enabled, cart-related buttons appear in chat, catalog, and product detail views.
                                    </Paragraph>
                                </Card>
                            </Col>
                            <Col xs={24} md={12}>
                                <Card title="Catalog Visibility" bordered>
                                    <Paragraph>Show or hide the product catalog storefront icon for your business number.</Paragraph>
                                    <Space>
                                        <Text>Catalog Visible:</Text>
                                        <Switch
                                            checked={commerceSettings?.is_catalog_visible ?? false}
                                            loading={settingsLoading}
                                            onChange={(checked) => updateCommerceSettings({ isCatalogVisible: checked })}
                                        />
                                    </Space>
                                    <Paragraph type="secondary" style={{ marginTop: 8, fontSize: 12 }}>
                                        When enabled, the catalog storefront icon appears in chat views and business profile.
                                    </Paragraph>
                                </Card>
                            </Col>
                            <Col span={24}>
                                <Alert
                                    type="info" showIcon
                                    message="Requirements"
                                    description="You must have inventory uploaded to Meta in an e-commerce catalog connected to your WhatsApp Business Account. Connect your catalog in the Catalog settings."
                                />
                            </Col>
                        </Row>
                    ),
                },
                {
                    key: 'catalog-templates',
                    label: <><FileTextOutlined /> Catalog Templates</>,
                    children: (
                        <div>
                            <Alert
                                type="info" showIcon style={{ marginBottom: 16 }}
                                message="Catalog Templates"
                                description="Catalog templates are MARKETING templates that showcase your product catalog within WhatsApp. They display a product thumbnail, custom body text, and a 'View catalog' button. Templates must be approved by Meta before sending."
                            />
                            <Space style={{ marginBottom: 16 }}>
                                <Button type="primary" icon={<PlusOutlined />} onClick={() => setTemplateModal(true)}>
                                    Create Catalog Template
                                </Button>
                                <Button icon={<SendOutlined />} onClick={() => setSendTemplateModal(true)}>
                                    Send Catalog Template
                                </Button>
                            </Space>
                        </div>
                    ),
                },
                {
                    key: 'catalog-messages',
                    label: <><AppstoreOutlined /> Catalog Messages</>,
                    children: (
                        <div>
                            <Alert
                                type="info" showIcon style={{ marginBottom: 16 }}
                                message="Interactive Catalog Messages"
                                description="Send interactive catalog messages that let customers browse your entire catalog within WhatsApp. No template approval needed — these are sent in real-time within existing conversation threads."
                            />
                            <Row gutter={[16, 16]}>
                                <Col xs={24} md={8}>
                                    <Card
                                        hoverable
                                        title={<><ShopOutlined /> Full Catalog</>}
                                        onClick={() => setCatalogMsgModal(true)}
                                        style={{ cursor: 'pointer', textAlign: 'center' }}
                                    >
                                        <Paragraph>Send your entire product catalog with a thumbnail, body text, and "View catalog" button.</Paragraph>
                                        <Button type="primary" icon={<SendOutlined />}>Send Catalog</Button>
                                    </Card>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Card
                                        hoverable
                                        title={<><TagsOutlined /> Single Product</>}
                                        onClick={() => setSingleProductModal(true)}
                                        style={{ cursor: 'pointer', textAlign: 'center' }}
                                    >
                                        <Paragraph>Send a single product with its image, title, price, and a "View" button.</Paragraph>
                                        <Button icon={<SendOutlined />}>Send Product</Button>
                                    </Card>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Card
                                        hoverable
                                        title={<><AppstoreOutlined /> Multi-Product</>}
                                        onClick={() => setMultiProductModal(true)}
                                        style={{ cursor: 'pointer', textAlign: 'center' }}
                                    >
                                        <Paragraph>Send multiple products organized in sections with a scrollable product list.</Paragraph>
                                        <Button icon={<SendOutlined />}>Send Products</Button>
                                    </Card>
                                </Col>
                            </Row>
                        </div>
                    ),
                },
                {
                    key: 'catalog-sync',
                    label: <><SyncOutlined /> Catalog Sync</>,
                    children: (
                        <div>
                            {/* Header */}
                            <div style={{ marginBottom: 24 }}>
                                <Space align="center" style={{ marginBottom: 4 }}>
                                    <CloudSyncOutlined style={{ fontSize: 24, color: '#4F46E5' }} />
                                    <Typography.Title level={4} style={{ margin: 0 }}>Sync to Meta Product Catalog</Typography.Title>
                                </Space>
                                <Typography.Text type="secondary" style={{ display: 'block', fontSize: 14 }}>
                                    Sync your products to Meta — power Instagram Shopping, WhatsApp Commerce & Dynamic Ads
                                </Typography.Text>
                            </div>

                            {/* Connection Card */}
                            <div style={{ marginBottom: 24 }}>
                                <CatalogConnectionCard config={configData} isLoading={configLoading} />
                            </div>

                            {/* Stats Row */}
                            {isConnected && (
                                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                                    <Col xs={24} sm={8}>
                                        <Card
                                            style={{ borderRadius: 12, background: 'linear-gradient(135deg, #F0F5FF, #FFFFFF)', border: '1px solid #D6E4FF' }}
                                        >
                                            <Statistic
                                                title={<span style={{ color: '#64748B' }}>Total Products Synced</span>}
                                                value={totalSynced}
                                                prefix={<CloudSyncOutlined style={{ color: '#4F46E5' }} />}
                                                valueStyle={{ color: '#4F46E5', fontWeight: 700 }}
                                            />
                                        </Card>
                                    </Col>
                                    <Col xs={24} sm={8}>
                                        <Card
                                            style={{ borderRadius: 12, background: 'linear-gradient(135deg, #F6FFED, #FFFFFF)', border: '1px solid #B7EB8F' }}
                                        >
                                            <Statistic
                                                title={<span style={{ color: '#64748B' }}>Last Sync Status</span>}
                                                value={lastSync ? lastSync.status.charAt(0).toUpperCase() + lastSync.status.slice(1) : 'N/A'}
                                                prefix={<HistoryOutlined style={{ color: '#52C41A' }} />}
                                                valueStyle={{ color: '#52C41A', fontWeight: 700 }}
                                            />
                                        </Card>
                                    </Col>
                                    <Col xs={24} sm={8}>
                                        <Card
                                            style={{ borderRadius: 12, background: totalFailed > 0 ? 'linear-gradient(135deg, #FFF2F0, #FFFFFF)' : 'linear-gradient(135deg, #F0F5FF, #FFFFFF)', border: totalFailed > 0 ? '1px solid #FFCCC7' : '1px solid #D6E4FF' }}
                                        >
                                            <Statistic
                                                title={<span style={{ color: '#64748B' }}>Failed Syncs</span>}
                                                value={totalFailed}
                                                prefix={<ShopOutlined style={{ color: totalFailed > 0 ? '#FF4D4F' : '#4F46E5' }} />}
                                                valueStyle={{ color: totalFailed > 0 ? '#FF4D4F' : '#4F46E5', fontWeight: 700 }}
                                            />
                                        </Card>
                                    </Col>
                                </Row>
                            )}

                            {/* Sync History */}
                            <Card
                                title={
                                    <Space>
                                        <HistoryOutlined style={{ color: '#4F46E5' }} />
                                        <span>Sync History</span>
                                    </Space>
                                }
                                style={{ borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                                extra={
                                    isConnected && (
                                        <Button
                                            type="primary"
                                            icon={<SyncOutlined spin={syncAllMutation.isPending} />}
                                            loading={syncAllMutation.isPending}
                                            onClick={() => syncAllMutation.mutate()}
                                            style={{
                                                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                                                border: 'none',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {syncAllMutation.isPending ? 'Syncing...' : 'Sync All Products'}
                                        </Button>
                                    )
                                }
                            >
                                <SyncHistoryTable logs={logs} isLoading={logsLoading} />
                            </Card>

                            {/* Info Banner */}
                            {!isConnected && !configLoading && (
                                <Alert
                                    message="Connect Your Meta Product Catalog"
                                    description={
                                        <span>
                                            Once connected, your products will automatically sync to Meta's commerce ecosystem.
                                            They'll be available for <strong>Instagram Shopping</strong> (product tags in posts),{' '}
                                            <strong>WhatsApp Commerce</strong> (catalog messages), and{' '}
                                            <strong>Advantage+ Catalog Ads</strong> (dynamic retargeting).
                                        </span>
                                    }
                                    type="info"
                                    showIcon
                                    style={{ marginTop: 24, borderRadius: 12 }}
                                    closable
                                />
                            )}
                        </div>
                    ),
                },
            ]} />

            {/* ── Create Catalog Template Modal ── */}
            <Modal
                title="Create Catalog Template"
                open={templateModal}
                onCancel={() => { setTemplateModal(false); setVarCount(0); }}
                footer={null}
                width={700}
            >
                <Alert type="warning" showIcon style={{ marginBottom: 16 }}
                    message="Template will be submitted to Meta for review. Category is automatically set to MARKETING."
                />
                <Form form={catalogTemplateForm} layout="vertical" onFinish={handleCreateTemplate}>
                    <Form.Item name="name" label="Template Name" rules={[{ required: true, message: 'Required' }]}
                        extra="Max 512 characters. Use lowercase and underscores (e.g., intro_catalog_offer)">
                        <Input placeholder="intro_catalog_offer" maxLength={512} />
                    </Form.Item>
                    <Form.Item name="language" label="Language" initialValue="en_US">
                        <Select>
                            <Option value="en_US">English (US)</Option>
                            <Option value="en">English</Option>
                            <Option value="hi">Hindi</Option>
                            <Option value="ar">Arabic</Option>
                            <Option value="pt_BR">Portuguese (Brazil)</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="bodyText" label="Body Text" rules={[{ required: true, message: 'Required' }]}
                        extra="Max 1024 characters. Use {{1}}, {{2}}, etc. for variables.">
                        <TextArea
                            rows={4} maxLength={1024}
                            placeholder="Now shop for your favorite products right here on WhatsApp! Get Rs {{1}} off on all orders above {{2}}Rs!"
                            onChange={(e) => setVarCount(countVariables(e.target.value))}
                        />
                    </Form.Item>
                    {varCount > 0 && (
                        <Card size="small" title={`Example values for ${varCount} variable(s)`} style={{ marginBottom: 16 }}>
                            {Array.from({ length: varCount }, (_, i) => (
                                <Form.Item key={i} name={`example_${i + 1}`} label={`{{${i + 1}}} example`} rules={[{ required: true }]}>
                                    <Input placeholder={`e.g., ${i === 0 ? '100' : i === 1 ? '400' : '3'}`} />
                                </Form.Item>
                            ))}
                        </Card>
                    )}
                    <Form.Item name="footerText" label="Footer Text (Optional)" extra="Max 60 characters">
                        <Input placeholder="Best grocery deals on WhatsApp!" maxLength={60} />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={sending} icon={<PlusOutlined />} block>
                            Create & Submit Template
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            {/* ── Send Catalog Template Modal ── */}
            <Modal
                title="Send Catalog Template Message"
                open={sendTemplateModal}
                onCancel={() => setSendTemplateModal(false)}
                footer={null}
                width={600}
            >
                <Alert type="info" showIcon style={{ marginBottom: 16 }}
                    message="Send an approved catalog template to a customer. The message will include a 'View catalog' button."
                />
                <Form form={sendTemplateForm} layout="vertical" onFinish={handleSendTemplate}>
                    <Form.Item name="recipientPhone" label="Recipient Phone" rules={[{ required: true }]}>
                        <Input placeholder="+919876543210" />
                    </Form.Item>
                    <Form.Item name="templateName" label="Template Name" rules={[{ required: true }]}>
                        <Input placeholder="intro_catalog_offer" />
                    </Form.Item>
                    <Form.Item name="language" label="Language" initialValue="en_US">
                        <Select>
                            <Option value="en_US">English (US)</Option>
                            <Option value="en">English</Option>
                            <Option value="hi">Hindi</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="paramCount" label="Number of Body Variables" initialValue={0}>
                        <InputNumber min={0} max={10} />
                    </Form.Item>
                    <Form.Item noStyle shouldUpdate={(prev, cur) => prev.paramCount !== cur.paramCount}>
                        {({ getFieldValue }) => {
                            const count = getFieldValue('paramCount') || 0;
                            return Array.from({ length: count }, (_, i) => (
                                <Form.Item key={i} name={`param_${i}`} label={`Variable {{${i + 1}}}`} rules={[{ required: true }]}>
                                    <Input placeholder={`Value for {{${i + 1}}}`} />
                                </Form.Item>
                            ));
                        }}
                    </Form.Item>
                    <Form.Item name="thumbnailProductRetailerId" label="Thumbnail Product SKU (Optional)"
                        extra="SKU of the product whose image will be used as the message header thumbnail.">
                        <Input placeholder="e.g., 2lc20305pt" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={sending} icon={<SendOutlined />} block>
                            Send Catalog Template
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            {/* ── Send Catalog Message Modal ── */}
            <Modal
                title="Send Catalog Message"
                open={catalogMsgModal}
                onCancel={() => setCatalogMsgModal(false)}
                footer={null}
                width={600}
            >
                <Alert type="info" showIcon style={{ marginBottom: 16 }}
                    message="Send your entire product catalog as an interactive message. Customer can tap 'View catalog' to browse all products within WhatsApp."
                />
                <Form form={catalogMsgForm} layout="vertical" onFinish={handleSendCatalogMsg}>
                    <Form.Item name="recipientPhone" label="Recipient Phone" rules={[{ required: true }]}>
                        <Input placeholder="+919876543210" />
                    </Form.Item>
                    <Form.Item name="bodyText" label="Body Text" rules={[{ required: true }]}
                        extra="Max 1024 characters">
                        <TextArea rows={3} maxLength={1024}
                            placeholder="Hello! Thanks for your interest. Just visit our catalog and add items to purchase." />
                    </Form.Item>
                    <Form.Item name="footerText" label="Footer Text (Optional)" extra="Max 60 characters">
                        <Input placeholder="Best grocery deals on WhatsApp!" maxLength={60} />
                    </Form.Item>
                    <Form.Item name="thumbnailProductRetailerId" label="Thumbnail Product SKU (Optional)">
                        <Input placeholder="e.g., 2lc20305pt" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={sending} icon={<SendOutlined />} block>
                            Send Catalog Message
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            {/* ── Send Single Product Modal ── */}
            <Modal
                title="Send Single Product Message"
                open={singleProductModal}
                onCancel={() => setSingleProductModal(false)}
                footer={null}
                width={600}
            >
                <Alert type="info" showIcon style={{ marginBottom: 16 }}
                    message="Send a single product from your catalog. The customer will see the product image, title, price, and a detail button."
                />
                <Form form={singleProductForm} layout="vertical" onFinish={handleSendSingleProduct}>
                    <Form.Item name="recipientPhone" label="Recipient Phone" rules={[{ required: true }]}>
                        <Input placeholder="+919876543210" />
                    </Form.Item>
                    <Form.Item name="catalogId" label="Catalog ID" rules={[{ required: true }]}
                        extra="Your Meta Commerce catalog ID">
                        <Input placeholder="e.g., 123456789" />
                    </Form.Item>
                    <Form.Item name="productRetailerId" label="Product Retailer ID (SKU)" rules={[{ required: true }]}
                        extra="The product SKU from your catalog">
                        <Input placeholder="e.g., 2lc20305pt" />
                    </Form.Item>
                    <Form.Item name="bodyText" label="Body Text (Optional)">
                        <TextArea rows={2} placeholder="Check out this product!" />
                    </Form.Item>
                    <Form.Item name="footerText" label="Footer Text (Optional)">
                        <Input placeholder="Limited time offer!" maxLength={60} />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={sending} icon={<SendOutlined />} block>
                            Send Product Message
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            {/* ── Send Multi Product Modal ── */}
            <Modal
                title="Send Multi-Product Message"
                open={multiProductModal}
                onCancel={() => setMultiProductModal(false)}
                footer={null}
                width={700}
            >
                <Alert type="info" showIcon style={{ marginBottom: 16 }}
                    message="Send up to 30 products organized in sections. The customer sees a scrollable product list with 'View all' and cart buttons."
                />
                <Form form={multiProductForm} layout="vertical" onFinish={handleSendMultiProduct}>
                    <Form.Item name="recipientPhone" label="Recipient Phone" rules={[{ required: true }]}>
                        <Input placeholder="+919876543210" />
                    </Form.Item>
                    <Form.Item name="catalogId" label="Catalog ID" rules={[{ required: true }]}>
                        <Input placeholder="e.g., 123456789" />
                    </Form.Item>
                    <Form.Item name="headerText" label="Header Text" rules={[{ required: true }]}>
                        <Input placeholder="Our Top Deals" />
                    </Form.Item>
                    <Form.Item name="bodyText" label="Body Text" rules={[{ required: true }]}>
                        <TextArea rows={2} placeholder="Browse our best products and add to cart!" />
                    </Form.Item>
                    <Form.Item name="footerText" label="Footer Text (Optional)">
                        <Input placeholder="Free delivery on orders above Rs 500!" maxLength={60} />
                    </Form.Item>
                    <Divider>Product Sections</Divider>
                    <Form.List name="sections" initialValue={[{ title: '', productRetailerIds: '' }]}>
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...rest }) => (
                                    <Card key={key} size="small" style={{ marginBottom: 8 }}
                                        title={`Section ${name + 1}`}
                                        extra={fields.length > 1 && (
                                            <Button size="small" danger onClick={() => remove(name)}>Remove</Button>
                                        )}>
                                        <Form.Item {...rest} name={[name, 'title']} label="Section Title" rules={[{ required: true }]}>
                                            <Input placeholder="e.g., Best Sellers" />
                                        </Form.Item>
                                        <Form.Item {...rest} name={[name, 'productRetailerIds']} label="Product SKUs (comma-separated)" rules={[{ required: true }]}
                                            extra="Enter product SKU/retailer IDs separated by commas">
                                            <TextArea rows={2} placeholder="SKU001, SKU002, SKU003" />
                                        </Form.Item>
                                    </Card>
                                ))}
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} style={{ marginBottom: 16 }}>
                                    Add Section
                                </Button>
                            </>
                        )}
                    </Form.List>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={sending} icon={<SendOutlined />} block>
                            Send Multi-Product Message
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default WhatsAppCatalog;
