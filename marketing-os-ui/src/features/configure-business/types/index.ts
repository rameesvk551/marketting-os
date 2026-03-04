// --- Common Types ---
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// --- Category Types ---
export interface Category {
    _id: string;
    name: string;
    slug: string;
    description: string;
    parentCategory?: string | Category;
    status: 'active' | 'inactive';
    tenantId: string;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
    subcategories?: Category[];
}

export interface CreateCategoryDTO {
    name: string;
    description?: string;
    parentCategory?: string;
    status?: 'active' | 'inactive';
}

export interface UpdateCategoryDTO extends Partial<CreateCategoryDTO> { }

export interface CategoryQuery {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    parentCategory?: string;
}

// --- Product Types ---
export interface Product {
    _id: string;
    productName: string;
    slug: string;
    description: string;
    shortDescription: string;
    price: number;
    discountPrice?: number;
    effectivePrice?: number;
    currency: string;
    sku: string;
    stockQuantity: number;
    images: string[];
    category: string | Category;
    tags: string[];
    status: 'active' | 'draft' | 'out-of-stock';
    isFeatured: boolean;
    isDeleted: boolean;
    views: number;
    clicks: number;
    createdBy: string;
    tenantId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateProductDTO {
    productName: string;
    description?: string;
    shortDescription?: string;
    price: number;
    discountPrice?: number;
    currency?: string;
    sku?: string;
    stockQuantity: number;
    images?: string[];
    category: string;
    tags?: string[];
    status?: 'active' | 'draft' | 'out-of-stock';
    isFeatured?: boolean;
}

export interface UpdateProductDTO extends Partial<CreateProductDTO> { }

export interface ProductQuery {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    status?: string;
    isFeatured?: boolean;
    minPrice?: number;
    maxPrice?: number;
}

// --- Order Types ---
export interface OrderProduct {
    product: string | Product;
    quantity: number;
    priceAtPurchase: number;
}

export interface Order {
    _id: string;
    orderId: string;
    customerName: string;
    phoneNumber: string;
    products: OrderProduct[];
    totalAmount: number;
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
    orderStatus: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
    notes?: string;
    source: 'whatsapp' | 'web' | 'manual';
    tenantId: string;
    createdBy?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateOrderDTO {
    customerName: string;
    phoneNumber: string;
    products: {
        product: string;
        quantity: number;
    }[];
    notes?: string;
    source?: 'whatsapp' | 'web' | 'manual';
}

export interface UpdateOrderStatusDTO {
    orderStatus?: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
    paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
}

export interface OrderQuery {
    page?: number;
    limit?: number;
    search?: string;
    paymentStatus?: string;
    orderStatus?: string;
    startDate?: string;
    endDate?: string;
}
