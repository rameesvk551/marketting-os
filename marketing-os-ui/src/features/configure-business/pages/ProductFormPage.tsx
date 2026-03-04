import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, InputNumber, Select, Switch, Row, Col, Typography, Upload } from 'antd';
import { ArrowLeftOutlined, UploadOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useProduct, useCreateProduct, useUpdateProduct } from '../hooks/useProductQueries';
import { useCategories } from '../hooks/useCategoryQueries';
import type { CreateProductDTO } from '../types';

const { Title } = Typography;
const { TextArea } = Input;

export const ProductFormPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [tags, setTags] = useState<string[]>([]);

    const { data: productData, isLoading: isLoadingProduct } = useProduct(id || '');
    const { data: categoriesData } = useCategories({ limit: 100 });
    const createMutation = useCreateProduct();
    const updateMutation = useUpdateProduct();

    useEffect(() => {
        if (isEditing && productData) {
            form.setFieldsValue({
                ...productData,
                category: typeof productData.category === 'object' ? productData.category._id : productData.category,
                isActive: productData.status === 'active',
                isFeatured: productData.isFeatured,
            });
            setTags(productData.tags || []);
        } else if (!isEditing) {
            form.setFieldsValue({ isActive: true, isFeatured: false, currency: 'INR', stockQuantity: 0 });
        }
    }, [isEditing, productData, form]);

    const handleBack = () => navigate('/configure-business/products');

    const onFinish = (values: any) => {
        const payload: CreateProductDTO = {
            ...values,
            tags,
            status: values.isActive ? 'active' : 'draft',
        };
        delete (payload as any).isActive;

        // Mock images for now since we don't have an upload endpoint yet
        payload.images = productData?.images || ['https://via.placeholder.com/300'];

        if (isEditing) {
            updateMutation.mutate(
                { id, data: payload },
                { onSuccess: handleBack }
            );
        } else {
            createMutation.mutate(payload, { onSuccess: handleBack });
        }
    };

    const categoryOptions = categoriesData?.map((c: any) => ({
        label: c.name,
        value: c._id,
    })) || [];

    return (
        <Card
            style={{ borderRadius: 12 }}
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Button icon={<ArrowLeftOutlined />} onClick={handleBack} type="text" />
                    <Title level={4} style={{ margin: 0 }}>
                        {isEditing ? 'Edit Product' : 'Add New Product'}
                    </Title>
                </div>
            }
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{ currency: 'INR', stockQuantity: 0 }}
                disabled={isLoadingProduct}
            >
                <Row gutter={24}>
                    <Col xs={24} md={16}>
                        <Card type="inner" title="Basic Information" style={{ marginBottom: 24 }}>
                            <Form.Item
                                name="productName"
                                label="Product Name"
                                rules={[{ required: true, message: 'Please enter product name' }]}
                            >
                                <Input placeholder="e.g. Premium T-Shirt" />
                            </Form.Item>

                            <Form.Item
                                name="shortDescription"
                                label="Short Description"
                                rules={[{ required: true, message: 'Please enter short description' }]}
                            >
                                <Input placeholder="Brief catchphrase or summary" />
                            </Form.Item>

                            <Form.Item
                                name="description"
                                label="Full Description"
                            >
                                <TextArea rows={6} placeholder="Detailed product description..." />
                            </Form.Item>
                        </Card>

                        <Card type="inner" title="Pricing & Inventory" style={{ marginBottom: 24 }}>
                            <Row gutter={16}>
                                <Col span={8}>
                                    <Form.Item name="currency" label="Currency" rules={[{ required: true }]}>
                                        <Select options={[{ label: 'INR (₹)', value: 'INR' }, { label: 'USD ($)', value: 'USD' }]} />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        name="price"
                                        label="Regular Price"
                                        rules={[{ required: true, message: 'Required' }]}
                                    >
                                        <InputNumber style={{ width: '100%' }} min={0} />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name="discountPrice" label="Discount Price">
                                        <InputNumber style={{ width: '100%' }} min={0} />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name="sku" label="SKU (Stock Keeping Unit)">
                                        <Input placeholder="e.g. TSH-01" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name="stockQuantity"
                                        label="Stock Quantity"
                                        rules={[{ required: true, message: 'Required' }]}
                                    >
                                        <InputNumber style={{ width: '100%' }} min={0} />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>
                    </Col>

                    <Col xs={24} md={8}>
                        <Card type="inner" title="Organization" style={{ marginBottom: 24 }}>
                            <Form.Item
                                name="category"
                                label="Category"
                                rules={[{ required: true, message: 'Category is required' }]}
                            >
                                <Select
                                    placeholder="Select category"
                                    options={categoryOptions}
                                    showSearch
                                    filterOption={(input, option) =>
                                        (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                                    }
                                />
                            </Form.Item>

                            <Form.Item label="Tags">
                                <Select
                                    mode="tags"
                                    style={{ width: '100%' }}
                                    placeholder="Add tags"
                                    value={tags}
                                    onChange={setTags}
                                />
                            </Form.Item>
                        </Card>

                        <Card type="inner" title="Media" style={{ marginBottom: 24 }}>
                            <Form.Item label="Product Images">
                                <Upload listType="picture-card" maxCount={4} multiple>
                                    <div>
                                        <UploadOutlined />
                                        <div style={{ marginTop: 8 }}>Upload</div>
                                    </div>
                                </Upload>
                                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                    (Image upload functionality to be implemented)
                                </Typography.Text>
                            </Form.Item>
                        </Card>

                        <Card type="inner" title="Visibility" style={{ marginBottom: 24 }}>
                            <Form.Item name="isActive" valuePropName="checked">
                                <Switch checkedChildren="Active" unCheckedChildren="Draft" />
                            </Form.Item>
                            <Form.Item name="isFeatured" valuePropName="checked">
                                <Switch checkedChildren="Featured" unCheckedChildren="Not Featured" />
                            </Form.Item>
                        </Card>
                    </Col>
                </Row>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                    <Button onClick={handleBack}>Cancel</Button>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={createMutation.isPending || updateMutation.isPending}
                    >
                        {isEditing ? 'Save Changes' : 'Create Product'}
                    </Button>
                </div>
            </Form>
        </Card>
    );
};
