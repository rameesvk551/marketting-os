import * as productRepo from './product.repository.js';
import type { CreateProductDTO, UpdateProductDTO, ProductQuery, PaginatedResult } from './product.types.js';
import { IProduct } from '../../db/nosqlmodels/Product.js';

// ── Product Service — Business Logic Layer ──

export const getAllProducts = async (
    tenantId: string,
    query: ProductQuery,
): Promise<PaginatedResult<IProduct>> => {
    return productRepo.findAll(tenantId, query);
};

export const getProductById = async (
    id: string,
    tenantId: string,
): Promise<IProduct> => {
    const product = await productRepo.findById(id, tenantId);
    if (!product) {
        throw Object.assign(new Error('Product not found'), { statusCode: 404 });
    }
    return product;
};

export const getProductBySlug = async (
    slug: string,
    tenantId: string,
): Promise<IProduct> => {
    const product = await productRepo.findBySlug(slug, tenantId);
    if (!product) {
        throw Object.assign(new Error('Product not found'), { statusCode: 404 });
    }
    // track view
    await productRepo.incrementViews((product as any)._id.toString());
    return product;
};

export const createProduct = async (
    tenantId: string,
    createdBy: string,
    data: CreateProductDTO,
): Promise<IProduct> => {
    return productRepo.create({
        ...data,
        tenantId,
        createdBy,
    } as any);
};

export const updateProduct = async (
    id: string,
    tenantId: string,
    data: UpdateProductDTO,
): Promise<IProduct> => {
    const product = await productRepo.update(id, tenantId, data);
    if (!product) {
        throw Object.assign(new Error('Product not found'), { statusCode: 404 });
    }
    return product;
};

export const deleteProduct = async (
    id: string,
    tenantId: string,
): Promise<void> => {
    const result = await productRepo.softDelete(id, tenantId);
    if (!result) {
        throw Object.assign(new Error('Product not found'), { statusCode: 404 });
    }
};

export const bulkDeleteProducts = async (
    ids: string[],
    tenantId: string,
): Promise<number> => {
    return productRepo.bulkSoftDelete(ids, tenantId);
};

export const toggleProductStatus = async (
    id: string,
    tenantId: string,
): Promise<IProduct> => {
    const product = await productRepo.toggleStatus(id, tenantId);
    if (!product) {
        throw Object.assign(new Error('Product not found'), { statusCode: 404 });
    }
    return product;
};

export const trackProductClick = async (id: string): Promise<void> => {
    await productRepo.incrementClicks(id);
};

export const getLowStockAlerts = async (
    tenantId: string,
    threshold?: number,
): Promise<IProduct[]> => {
    return productRepo.getLowStockProducts(tenantId, threshold);
};

export const generateWhatsAppShareMessage = (product: IProduct, businessSlug: string): string => {
    const productUrl = `https://yourapp.com/store/${businessSlug}/${product.slug}`;
    const price = product.discountPrice && product.discountPrice < product.price
        ? `₹${product.discountPrice} (was ₹${product.price})`
        : `₹${product.price}`;

    return `Hi 👋 Check out this product: *${product.productName}*\nPrice: ${price}\nBuy now: ${productUrl}`;
};
