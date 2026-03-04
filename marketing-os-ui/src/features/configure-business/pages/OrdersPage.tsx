import React, { useState } from 'react';
import { Card, Table, Input, Select, DatePicker, Tag, Typography, Button, Space, Drawer, Descriptions, Divider } from 'antd';
import { SearchOutlined, EyeOutlined, FilterOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useOrders, useUpdateOrderStatus } from '../hooks/useOrderQueries';
import type { Order, OrderQuery } from '../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Status colors
const orderStatusColors: Record<string, string> = {
    pending: 'warning',
    confirmed: 'processing',
    shipped: 'purple',
    delivered: 'success',
    cancelled: 'error',
};

const paymentStatusColors: Record<string, string> = {
    pending: 'warning',
    paid: 'success',
    failed: 'error',
    refunded: 'default',
};

export const OrdersPage: React.FC = () => {
    const [queryParams, setQueryParams] = useState<OrderQuery>({ page: 1, limit: 10 });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [drawerVisible, setDrawerVisible] = useState(false);

    const { data: ordersData, isLoading } = useOrders(queryParams);
    const updateStatusMutation = useUpdateOrderStatus();

    const handleSearch = (value: string) => {
        setQueryParams(prev => ({ ...prev, search: value, page: 1 }));
    };

    const handleFilterChange = (key: string, value: any) => {
        setQueryParams(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const handleDateRange = (_dates: any, dateStrings: [string, string]) => {
        setQueryParams(prev => ({
            ...prev,
            startDate: dateStrings[0] || undefined,
            endDate: dateStrings[1] || undefined,
            page: 1,
        }));
    };

    const handleTableChange = (pagination: any) => {
        setQueryParams(prev => ({
            ...prev,
            page: pagination.current,
            limit: pagination.pageSize,
        }));
    };

    const viewOrderDetails = (order: Order) => {
        setSelectedOrder(order);
        setDrawerVisible(true);
    };

    const handleStatusUpdate = (orderId: string, type: 'orderStatus' | 'paymentStatus', value: string) => {
        updateStatusMutation.mutate({
            id: orderId,
            data: { [type]: value }
        });
        if (selectedOrder && selectedOrder._id === orderId) {
            setSelectedOrder({ ...selectedOrder, [type]: value } as Order);
        }
    };

    const columns: ColumnsType<Order> = [
        {
            title: 'Order ID',
            dataIndex: 'orderId',
            key: 'orderId',
            render: (text) => <Text strong>{text}</Text>,
        },
        {
            title: 'Customer',
            dataIndex: 'customerName',
            key: 'customerName',
            render: (text, record) => (
                <div>
                    <div>{text}</div>
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.phoneNumber}</div>
                </div>
            )
        },
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => dayjs(date).format('MMM D, YYYY h:mm A'),
        },
        {
            title: 'Total',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            render: (amount, record) => {
                const currency = record.products[0]?.product && typeof record.products[0].product === 'object'
                    ? (record.products[0].product as any).currency
                    : 'INR';
                return <Text strong>{currency} {amount}</Text>;
            },
        },
        {
            title: 'Order Status',
            dataIndex: 'orderStatus',
            key: 'orderStatus',
            render: (status: string) => (
                <Tag color={orderStatusColors[status] || 'default'}>
                    {status.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Payment',
            dataIndex: 'paymentStatus',
            key: 'paymentStatus',
            render: (status: string) => (
                <Tag color={paymentStatusColors[status] || 'default'}>
                    {status.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Action',
            key: 'action',
            width: 80,
            render: (_, record) => (
                <Button type="text" icon={<EyeOutlined />} onClick={() => viewOrderDetails(record)}>
                    View
                </Button>
            ),
        },
    ];

    return (
        <Card style={{ borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
                <div>
                    <Title level={4} style={{ margin: 0 }}>Orders</Title>
                    <Text type="secondary">View and manage customer orders</Text>
                </div>
            </div>

            <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <Input
                    placeholder="Search order ID or customer..."
                    prefix={<SearchOutlined />}
                    style={{ width: 250 }}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onPressEnter={() => handleSearch(searchTerm)}
                />

                <Select
                    placeholder="Order Status"
                    style={{ width: 150 }}
                    allowClear
                    onChange={(val) => handleFilterChange('orderStatus', val)}
                    options={[
                        { label: 'Pending', value: 'pending' },
                        { label: 'Confirmed', value: 'confirmed' },
                        { label: 'Shipped', value: 'shipped' },
                        { label: 'Delivered', value: 'delivered' },
                        { label: 'Cancelled', value: 'cancelled' },
                    ]}
                />

                <Select
                    placeholder="Payment Status"
                    style={{ width: 150 }}
                    allowClear
                    onChange={(val) => handleFilterChange('paymentStatus', val)}
                    options={[
                        { label: 'Pending', value: 'pending' },
                        { label: 'Paid', value: 'paid' },
                        { label: 'Failed', value: 'failed' },
                        { label: 'Refunded', value: 'refunded' },
                    ]}
                />

                <RangePicker onChange={handleDateRange} />

                <Button onClick={() => handleSearch(searchTerm)} icon={<FilterOutlined />}>Filter</Button>
            </div>

            <Table
                columns={columns}
                dataSource={ordersData?.data || []}
                rowKey="_id"
                loading={isLoading}
                pagination={{
                    current: queryParams.page,
                    pageSize: queryParams.limit,
                    total: ordersData?.total || 0,
                    showSizeChanger: true,
                }}
                onChange={handleTableChange}
            />

            {/* Order Details Drawer */}
            <Drawer
                title={`Order Details: ${selectedOrder?.orderId}`}
                placement="right"
                width={600}
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
            >
                {selectedOrder && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                            <Space direction="vertical">
                                <Text type="secondary">Order Date</Text>
                                <Text strong>{dayjs(selectedOrder.createdAt).format('MMMM D, YYYY h:mm A')}</Text>
                            </Space>
                            <Space direction="vertical">
                                <Text type="secondary">Source</Text>
                                <Tag color="blue">{selectedOrder.source.toUpperCase()}</Tag>
                            </Space>
                        </div>

                        <Divider />

                        <Title level={5}>Customer Information</Title>
                        <Descriptions column={2} style={{ marginBottom: 24 }}>
                            <Descriptions.Item label="Name">{selectedOrder.customerName}</Descriptions.Item>
                            <Descriptions.Item label="Phone">{selectedOrder.phoneNumber}</Descriptions.Item>
                        </Descriptions>

                        <Divider />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Title level={5} style={{ margin: 0 }}>Order Status</Title>
                            <Space>
                                <Select
                                    value={selectedOrder.orderStatus}
                                    style={{ width: 130 }}
                                    onChange={(val) => handleStatusUpdate(selectedOrder._id, 'orderStatus', val)}
                                    options={[
                                        { label: 'Pending', value: 'pending' },
                                        { label: 'Confirmed', value: 'confirmed' },
                                        { label: 'Shipped', value: 'shipped' },
                                        { label: 'Delivered', value: 'delivered' },
                                        { label: 'Cancelled', value: 'cancelled' },
                                    ]}
                                />
                                <Select
                                    value={selectedOrder.paymentStatus}
                                    style={{ width: 130 }}
                                    onChange={(val) => handleStatusUpdate(selectedOrder._id, 'paymentStatus', val)}
                                    options={[
                                        { label: 'Pending (Pay)', value: 'pending' },
                                        { label: 'Paid', value: 'paid' },
                                        { label: 'Failed', value: 'failed' },
                                        { label: 'Refunded', value: 'refunded' },
                                    ]}
                                />
                            </Space>
                        </div>

                        <Divider />

                        <Title level={5}>Order Items</Title>
                        <Table
                            dataSource={selectedOrder.products}
                            rowKey={(record) => typeof record.product === 'object' ? record.product._id : record.product}
                            pagination={false}
                            columns={[
                                {
                                    title: 'Product',
                                    key: 'product',
                                    render: (_, record) => typeof record.product === 'object' ? record.product.productName : 'Product ID',
                                },
                                {
                                    title: 'Price',
                                    dataIndex: 'priceAtPurchase',
                                    key: 'price',
                                    render: (price) => `₹${price}`,
                                },
                                {
                                    title: 'Qty',
                                    dataIndex: 'quantity',
                                    key: 'quantity',
                                },
                                {
                                    title: 'Total',
                                    key: 'total',
                                    render: (_, record) => <Text strong>₹{record.priceAtPurchase * record.quantity}</Text>,
                                },
                            ]}
                        />

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                            <Space direction="vertical" align="end">
                                <Title level={4} style={{ margin: 0 }}>Total: ₹{selectedOrder.totalAmount}</Title>
                                {selectedOrder.notes && (
                                    <Text type="secondary" style={{ fontStyle: 'italic' }}>Note: {selectedOrder.notes}</Text>
                                )}
                            </Space>
                        </div>
                    </div>
                )}
            </Drawer>
        </Card>
    );
};
