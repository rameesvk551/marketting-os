import React, { useState } from 'react';
import { Card, Table, Button, Input, Tag, Modal, Typography, Dropdown } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../hooks/useCategoryQueries';
import type { Category, CategoryQuery } from '../types';
import { CategoryFormModal } from '../components/CategoryFormModal';

const { Title } = Typography;

export const CategoriesPage: React.FC = () => {
    const [queryParams, setQueryParams] = useState<CategoryQuery>({ page: 1, limit: 10 });
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    const { data: categoriesData, isLoading } = useCategories(queryParams);
    const createMutation = useCreateCategory();
    const updateMutation = useUpdateCategory();
    const deleteMutation = useDeleteCategory();

    const handleSearch = (value: string) => {
        setQueryParams(prev => ({ ...prev, search: value, page: 1 }));
    };

    const handleTableChange = (pagination: any) => {
        setQueryParams(prev => ({
            ...prev,
            page: pagination.current,
            limit: pagination.pageSize,
        }));
    };

    const handleAdd = () => {
        setEditingCategory(null);
        setIsModalVisible(true);
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setIsModalVisible(true);
    };

    const handleDelete = (id: string) => {
        Modal.confirm({
            title: 'Delete Category',
            content: 'Are you sure you want to delete this category?',
            okText: 'Yes, delete',
            okType: 'danger',
            onOk: () => {
                deleteMutation.mutate(id);
            },
        });
    };

    const handleSubmit = (values: any) => {
        if (editingCategory) {
            updateMutation.mutate(
                { id: editingCategory._id, data: values },
                { onSuccess: () => setIsModalVisible(false) }
            );
        } else {
            createMutation.mutate(values, {
                onSuccess: () => setIsModalVisible(false),
            });
        }
    };

    const columns: ColumnsType<Category> = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            sorter: true,
            render: (text, record) => (
                <div>
                    <div style={{ fontWeight: 500 }}>{text}</div>
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>/{record.slug}</div>
                </div>
            )
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
        },
        {
            title: 'Parent Category',
            dataIndex: 'parentCategory',
            key: 'parentCategory',
            render: (parent) => {
                if (!parent) return <span style={{ color: '#bfbfbf' }}>None</span>;
                return typeof parent === 'object' ? parent.name : 'Unknown';
            },
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={status === 'active' ? 'success' : 'default'}>
                    {status.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Subcategories',
            key: 'subcategories',
            render: (_, record) => record.subcategories?.length || 0,
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
                        onClick: () => handleEdit(record),
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
                    <Title level={4} style={{ margin: 0 }}>Categories</Title>
                    <Typography.Text type="secondary">Manage product taxonomy and organization</Typography.Text>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                    Add Category
                </Button>
            </div>

            <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
                <Input
                    placeholder="Search categories..."
                    prefix={<SearchOutlined />}
                    style={{ width: 300 }}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onPressEnter={() => handleSearch(searchTerm)}
                />
                <Button onClick={() => handleSearch(searchTerm)}>Search</Button>
                {searchTerm && (
                    <Button type="link" onClick={() => { setSearchTerm(''); handleSearch(''); }}>
                        Clear
                    </Button>
                )}
            </div>

            <Table
                columns={columns}
                dataSource={categoriesData || []}
                rowKey="_id"
                loading={isLoading}
                pagination={{
                    current: queryParams.page,
                    pageSize: queryParams.limit,
                    total: categoriesData?.length || 0,
                    showSizeChanger: true,
                }}
                onChange={handleTableChange}
            />

            <CategoryFormModal
                visible={isModalVisible}
                initialValues={editingCategory}
                onClose={() => setIsModalVisible(false)}
                onSubmit={handleSubmit}
                loading={createMutation.isPending || updateMutation.isPending}
            />
        </Card>
    );
};
