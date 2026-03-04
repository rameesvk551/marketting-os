import Product, { IProduct } from '../../db/nosqlmodels/Product.js';
import type { ProductQuery, PaginatedResult } from './product.types.js';

// ── Product Repository — Data Access Layer ──

export const findAll = async (
    tenantId: string,
    query: ProductQuery,
): Promise<PaginatedResult<IProduct>> => {
    const {
        page = 1,
        limit = 20,
        search,
        category,
        status,
        isFeatured,
        sortBy = 'createdAt',
        sortOrder = 'desc',
    } = query;

    const filter: any = { tenantId, isDeleted: false };

    if (search) {
        filter.$text = { $search: search };
    }
    if (category) {
        filter.category = category;
    }
    if (status) {
        filter.status = status;
    }
    if (isFeatured !== undefined) {
        filter.isFeatured = isFeatured;
    }

    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        Product.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate('category', 'name slug')
            .lean(),
        Product.countDocuments(filter),
    ]);

    return {
        data: data as IProduct[],
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};

export const findById = async (
    id: string,
    tenantId: string,
): Promise<IProduct | null> => {
    return Product.findOne({ _id: id, tenantId, isDeleted: false })
        .populate('category', 'name slug')
        .lean();
};

export const findBySlug = async (
    slug: string,
    tenantId: string,
): Promise<IProduct | null> => {
    return Product.findOne({ slug, tenantId, isDeleted: false })
        .populate('category', 'name slug')
        .lean();
};

export const create = async (
    data: Partial<IProduct>,
): Promise<IProduct> => {
    const product = new Product(data);
    await product.save();
    return product.toObject();
};

export const update = async (
    id: string,
    tenantId: string,
    data: any,
): Promise<IProduct | null> => {
    const product = await Product.findOne({ _id: id, tenantId, isDeleted: false });
    if (!product) return null;

    Object.assign(product, data);
    await product.save(); // triggers pre-save hooks (slug regeneration)
    return product.toObject();
};

export const softDelete = async (
    id: string,
    tenantId: string,
): Promise<boolean> => {
    const result = await Product.updateOne(
        { _id: id, tenantId },
        { isDeleted: true },
    );
    return result.modifiedCount > 0;
};

export const bulkSoftDelete = async (
    ids: string[],
    tenantId: string,
): Promise<number> => {
    const result = await Product.updateMany(
        { _id: { $in: ids }, tenantId },
        { isDeleted: true },
    );
    return result.modifiedCount;
};

export const toggleStatus = async (
    id: string,
    tenantId: string,
): Promise<IProduct | null> => {
    const product = await Product.findOne({ _id: id, tenantId, isDeleted: false });
    if (!product) return null;

    product.status = product.status === 'active' ? 'draft' : 'active';
    await product.save();
    return product.toObject();
};

export const incrementViews = async (id: string): Promise<void> => {
    await Product.updateOne({ _id: id }, { $inc: { views: 1 } });
};

export const incrementClicks = async (id: string): Promise<void> => {
    await Product.updateOne({ _id: id }, { $inc: { clicks: 1 } });
};

export const getLowStockProducts = async (
    tenantId: string,
    threshold: number = 5,
): Promise<IProduct[]> => {
    return Product.find({
        tenantId,
        isDeleted: false,
        stockQuantity: { $lte: threshold },
        status: { $ne: 'draft' },
    }).lean() as Promise<IProduct[]>;
};
