// ── Product Types ──

export interface CreateProductDTO {
    productName: string;
    description?: string;
    shortDescription?: string;
    price: number;
    discountPrice?: number;
    currency?: string;
    sku?: string;
    stockQuantity?: number;
    images?: string[];
    category?: string;
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
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
