import Category, { ICategory } from '../../db/nosqlmodels/Category.js';

// ── Category Repository — Data Access Layer ──

export const findAll = async (
    tenantId: string,
    query: { status?: string; parent?: string },
): Promise<ICategory[]> => {
    const filter: any = { tenantId, isDeleted: false };

    if (query.status) {
        filter.status = query.status;
    }
    if (query.parent) {
        filter.parentCategory = query.parent;
    }

    return Category.find(filter)
        .populate('parentCategory', 'name slug')
        .sort({ name: 1 })
        .lean() as Promise<ICategory[]>;
};

export const findById = async (
    id: string,
    tenantId: string,
): Promise<ICategory | null> => {
    return Category.findOne({ _id: id, tenantId, isDeleted: false })
        .populate('parentCategory', 'name slug')
        .lean();
};

export const create = async (data: Partial<ICategory>): Promise<ICategory> => {
    const category = new Category(data);
    await category.save();
    return category.toObject();
};

export const update = async (
    id: string,
    tenantId: string,
    data: any,
): Promise<ICategory | null> => {
    const category = await Category.findOne({ _id: id, tenantId, isDeleted: false });
    if (!category) return null;

    Object.assign(category, data);
    await category.save();
    return category.toObject();
};

export const softDelete = async (id: string, tenantId: string): Promise<boolean> => {
    const result = await Category.updateOne(
        { _id: id, tenantId },
        { isDeleted: true },
    );
    return result.modifiedCount > 0;
};

export const findActiveCategories = async (tenantId: string): Promise<ICategory[]> => {
    return Category.find({ tenantId, status: 'active', isDeleted: false })
        .sort({ name: 1 })
        .lean() as Promise<ICategory[]>;
};
