// ── Order Types ──

export interface CreateOrderDTO {
    customerName: string;
    phoneNumber: string;
    products: {
        product: string;
        productName: string;
        quantity: number;
        price: number;
    }[];
    totalAmount: number;
    notes?: string;
    source?: 'whatsapp' | 'product-link' | 'manual';
}

export interface UpdateOrderStatusDTO {
    orderStatus?: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
    paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
}

export interface OrderQuery {
    page?: number;
    limit?: number;
    orderStatus?: string;
    paymentStatus?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
