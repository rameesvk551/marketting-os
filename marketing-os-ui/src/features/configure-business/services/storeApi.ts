import client from '../../../api/client';
import type {
    Product,
    CreateProductDTO,
    UpdateProductDTO,
    ProductQuery,
    PaginatedResponse,
    Category,
    CreateCategoryDTO,
    UpdateCategoryDTO,
    CategoryQuery,
    Order,
    CreateOrderDTO,
    UpdateOrderStatusDTO,
    OrderQuery,
} from '../types';

// ==========================================
// PRODUCTS
// ==========================================
export const getProducts = async (params?: ProductQuery): Promise<PaginatedResponse<Product>> => {
    const { data } = await client.get('/store/products', { params });
    return {
        data: data.data,
        ...data.pagination,
        totalPages: data.pagination?.totalPages || Math.ceil((data.pagination?.total || 0) / (data.pagination?.limit || 10))
    };
};

export const getProductById = async (id: string): Promise<Product> => {
    const { data } = await client.get(`/store/products/${id}`);
    return data.data;
};

export const createProduct = async (payload: CreateProductDTO): Promise<Product> => {
    const { data } = await client.post('/store/products', payload);
    return data.data;
};

export const updateProduct = async (id: string, payload: UpdateProductDTO): Promise<Product> => {
    const { data } = await client.put(`/store/products/${id}`, payload);
    return data.data;
};

export const deleteProduct = async (id: string): Promise<void> => {
    await client.delete(`/store/products/${id}`);
};

export const bulkDeleteProducts = async (ids: string[]): Promise<{ deletedCount: number }> => {
    const { data } = await client.post('/store/products/bulk-delete', { ids });
    return data.data;
};

export const toggleProductStatus = async (id: string, status: 'active' | 'draft' | 'out-of-stock'): Promise<Product> => {
    const { data } = await client.patch(`/store/products/${id}/toggle-status`, { status });
    return data.data;
};

export const generateWhatsAppShareLink = async (id: string): Promise<{ message: string; encodedMessage: string }> => {
    const { data } = await client.get(`/store/products/${id}/share`);
    return data.data;
};


// ==========================================
// CATEGORIES
// ==========================================
export const getCategories = async (params?: CategoryQuery): Promise<Category[]> => {
    const { data } = await client.get('/store/categories', { params });
    return data.data;
};

export const getCategoryById = async (id: string): Promise<Category> => {
    const { data } = await client.get(`/store/categories/${id}`);
    return data.data;
};

export const createCategory = async (payload: CreateCategoryDTO): Promise<Category> => {
    const { data } = await client.post('/store/categories', payload);
    return data.data;
};

export const updateCategory = async (id: string, payload: UpdateCategoryDTO): Promise<Category> => {
    const { data } = await client.put(`/store/categories/${id}`, payload);
    return data.data;
};

export const deleteCategory = async (id: string): Promise<void> => {
    await client.delete(`/store/categories/${id}`);
};


// ==========================================
// ORDERS
// ==========================================
export const getOrders = async (params?: OrderQuery): Promise<PaginatedResponse<Order>> => {
    const { data } = await client.get('/store/orders', { params });
    return {
        data: data.data,
        ...data.pagination,
        totalPages: data.pagination?.totalPages || Math.ceil((data.pagination?.total || 0) / (data.pagination?.limit || 10))
    };
};

export const getOrderById = async (id: string): Promise<Order> => {
    const { data } = await client.get(`/store/orders/${id}`);
    return data.data;
};

export const createOrder = async (payload: CreateOrderDTO): Promise<Order> => {
    const { data } = await client.post('/store/orders', payload);
    return data.data;
};

export const updateOrderStatus = async (id: string, payload: UpdateOrderStatusDTO): Promise<Order> => {
    const { data } = await client.patch(`/store/orders/${id}/status`, payload);
    return data.data;
};

export const getOrderStats = async (): Promise<any> => {
    const { data } = await client.get('/store/orders/stats/summary');
    return data.data;
};
