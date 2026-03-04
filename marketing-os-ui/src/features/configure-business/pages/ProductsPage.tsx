import React, { useState } from 'react';
import { Card, Table, Button, Input, Tag, Typography, Dropdown, Space, Select, Modal } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, MoreOutlined, FilterOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import { useProducts, useDeleteProduct, useToggleProductStatus, useGenerateWhatsAppShare } from '../hooks/useProductQueries';
import { useCategories } from '../hooks/useCategoryQueries';
import type { Product, ProductQuery } from '../types';

const { Title, Text } = Typography;

export const ProductsPage: React.FC = () => {
    const navigate = useNavigate();
    const [queryParams, setQueryParams] = useState<ProductQuery>({ page: 1, limit: 10 });
    const [searchTerm, setSearchTerm] = useState('');

    const { data: productsData, isLoading } = useProducts(queryParams);
    const { data: categoriesData } = useCategories({ limit: 100 });
    const deleteMutation = useDeleteProduct();
    const toggleStatusMutation = useToggleProductStatus();
    const shareMutation = useGenerateWhatsAppShare();

    const handleSearch = (value: string) => {
        setQueryParams(prev => ({ ...prev, search: value, page: 1 }));
    };

    const handleFilterChange = (key: string, value: string) => {
        setQueryParams(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const handleTableChange = (pagination: any) => {
        setQueryParams(prev => ({
            ...prev,
            page: pagination.current,
            limit: pagination.pageSize,
        }));
    };

    const handleDelete = (id: string) => {
        Modal.confirm({
            title: 'Delete Product',
            content: 'Are you sure you want to delete this product?',
            okText: 'Yes, delete',
            okType: 'danger',
            onOk: () => {
                deleteMutation.mutate(id);
            },
        });
    };

    const handleToggleStatus = (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'draft' : 'active';
        toggleStatusMutation.mutate({ id, status: newStatus as any });
    };

    const handleShare = (id: string) => {
        shareMutation.mutate(id, {
            onSuccess: (data) => {
                const url = `https://wa.me/?text=${data.encodedMessage}`;
                window.open(url, '_blank');
            }
        });
    };

    const columns: ColumnsType<Product> = [
        {
            title: 'Product',
            dataIndex: 'productName',
            key: 'productName',
            render: (text, record) => (
                <Space>
                    {record.images?.[0] ? (
                        <div style={{ width: 40, height: 40, borderRadius: 6, overflow: 'hidden', background: '#f5f5f5' }}>
                            <img src={record.images[0]} alt={text} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    ) : (
                        <div style={{ width: 40, height: 40, borderRadius: 6, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                            IMG
                        </div>
                    )}
                    <div>
                        <div style={{ fontWeight: 500 }}>{text}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>Stock: {record.stockQuantity}</div>
                    </div>
                </Space>
            )
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            render: (category) => typeof category === 'object' ? category.name : 'Unknown'
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            render: (_, record) => (
                <div>
                    <div>{record.currency} {record.effectivePrice || record.discountPrice || record.price}</div>
                    {record.discountPrice && (
                        <div style={{ fontSize: 12, color: '#94a3b8', textDecoration: 'line-through' }}>
                            {record.currency} {record.price}
                        </div>
                    )}
                </div>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const colorMap: Record<string, string> = {
                    'active': 'success',
                    'draft': 'default',
                    'out-of-stock': 'error'
                };
                return <Tag color={colorMap[status] || 'default'}>{status.toUpperCase()}</Tag>;
            },
        },
        {
            title: 'Action',
            key: 'action',
            width: 80,
            render: (_, record) => {
                const items = [
                    {
                        key: 'edit',
                        icon: <EditOutlined />,
                        label: 'Edit',
                        onClick: () => navigate(`/configure-business/products/${record._id}/edit`),
                    },
                    {
                        key: 'toggle',
                        icon: record.status === 'active' ? <EditOutlined /> : <PlusOutlined />, // Using available icons
                        label: record.status === 'active' ? 'Mark as Draft' : 'Publish',
                        onClick: () => handleToggleStatus(record._id, record.status),
                    },
                    {
                        key: 'share',
                        icon: <PlusOutlined />, // or WhatsAppOutlined if available
                        label: 'Share on WhatsApp',
                        onClick: () => handleShare(record._id),
                    },
                    {
                        key: 'delete',
                        icon: <DeleteOutlined />,
                        label: 'Delete',
                        danger: true,
                        onClick: () => handleDelete(record._id),
                    },
                ];

                return (
                    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
                        <Button type="text" icon={<MoreOutlined />} />
                    </Dropdown>
                );
            },
        },
    ];

    return (
        <Card style={{ borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
                <div>
                    <Title level={4} style={{ margin: 0 }}>Products</Title>
                    <Text type="secondary">Manage your product catalog and inventory</Text>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/configure-business/products/new')}>
                    Add Product
                </Button>
            </div>

            <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <Input
                    placeholder="Search products..."
                    prefix={<SearchOutlined />}
                    style={{ width: 300 }}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onPressEnter={() => handleSearch(searchTerm)}
                />

                <Select
                    placeholder="Category"
                    style={{ width: 160 }}
                    allowClear
                    onChange={(val) => handleFilterChange('category', val)}
                    options={categoriesData?.map((c: any) => ({ label: c.name, value: c._id })) || []}
                />

                <Select
                    placeholder="Status"
                    style={{ width: 160 }}
                    allowClear
                    onChange={(val) => handleFilterChange('status', val)}
                    options={[
                        { label: 'Active', value: 'active' },
                        { label: 'Draft', value: 'draft' },
                        { label: 'Out of Stock', value: 'out-of-stock' },
                    ]}
                />

                <Button onClick={() => handleSearch(searchTerm)} icon={<FilterOutlined />}>Filter</Button>

                {Object.keys(queryParams).length > 2 && (
                    <Button type="link" onClick={() => {
                        setSearchTerm('');
                        setQueryParams({ page: 1, limit: 10 });
                    }}>
                        Clear Filters
                    </Button>
                )}
            </div>

            <Table
                columns={columns}
                dataSource={productsData?.data || []}
                rowKey="_id"
                loading={isLoading}
                pagination={{
                    current: queryParams.page,
                    pageSize: queryParams.limit,
                    total: productsData?.total || 0,
                    showSizeChanger: true,
                }}
                onChange={handleTableChange}
            />
        </Card>
    );
};
