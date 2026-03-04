import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Switch } from 'antd';
import type { Category, CreateCategoryDTO, UpdateCategoryDTO } from '../types';
import { useCategories } from '../hooks/useCategoryQueries';

interface CategoryFormModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (values: CreateCategoryDTO | UpdateCategoryDTO) => void;
    initialValues?: Category | null;
    loading?: boolean;
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
    visible,
    onClose,
    onSubmit,
    initialValues,
    loading,
}) => {
    const [form] = Form.useForm();
    const { data: categoriesData } = useCategories({ limit: 100 }); // Fetch potential parent categories

    useEffect(() => {
        if (visible && initialValues) {
            form.setFieldsValue({
                ...initialValues,
                parentCategory: typeof initialValues.parentCategory === 'object'
                    ? initialValues.parentCategory?._id
                    : initialValues.parentCategory,
                isActive: initialValues.status === 'active',
            });
        } else if (visible) {
            form.resetFields();
            form.setFieldsValue({ isActive: true });
        }
    }, [visible, initialValues, form]);

    const handleOk = () => {
        form.validateFields().then((values) => {
            const payload = {
                ...values,
                status: values.isActive ? 'active' : 'inactive',
            };
            delete payload.isActive;
            onSubmit(payload);
        });
    };

    // Filter out the current category and its children from parent options
    const parentOptions = categoriesData
        ?.filter(c => c._id !== initialValues?._id)
        ?.map(c => ({
            label: c.name,
            value: c._id,
        })) || [];

    return (
        <Modal
            title={initialValues ? 'Edit Category' : 'Create Category'}
            open={visible}
            onOk={handleOk}
            onCancel={onClose}
            confirmLoading={loading}
            okText={initialValues ? 'Update' : 'Create'}
            destroyOnClose
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    name="name"
                    label="Category Name"
                    rules={[{ required: true, message: 'Please enter category name' }]}
                >
                    <Input placeholder="e.g. Electronics, Clothing" />
                </Form.Item>

                <Form.Item
                    name="description"
                    label="Description"
                >
                    <Input.TextArea placeholder="Brief description of the category" rows={3} />
                </Form.Item>

                <Form.Item
                    name="parentCategory"
                    label="Parent Category (Optional)"
                >
                    <Select
                        placeholder="Select a parent category"
                        allowClear
                        options={parentOptions}
                        showSearch
                        filterOption={(input, option) =>
                            (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                        }
                    />
                </Form.Item>

                <Form.Item
                    name="isActive"
                    label="Status"
                    valuePropName="checked"
                >
                    <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                </Form.Item>
            </Form>
        </Modal>
    );
};
