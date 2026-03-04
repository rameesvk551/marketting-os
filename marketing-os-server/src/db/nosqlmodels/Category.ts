import mongoose, { Schema, Document, Types } from 'mongoose';

const slugify = (text: string): string => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
};

const generateSlug = (text: string): string => {
    return slugify(text) + '-' + Math.floor(Math.random() * 100000).toString();
};

export interface ICategory extends Document {
    name: string;
    slug: string;
    description: string;
    parentCategory?: Types.ObjectId;
    status: 'active' | 'inactive';
    tenantId: string;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
    {
        name: {
            type: String,
            required: [true, 'Category name is required'],
            trim: true,
            maxlength: [100, 'Category name cannot exceed 100 characters'],
        },
        slug: {
            type: String,
            unique: true,
            trim: true,
            lowercase: true,
        },
        description: {
            type: String,
            default: '',
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        parentCategory: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            default: null,
        },
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active',
        },
        tenantId: {
            type: String,
            required: [true, 'Tenant ID is required'],
            index: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

CategorySchema.index({ slug: 1, tenantId: 1 }, { unique: true });
CategorySchema.index({ status: 1, tenantId: 1 });
CategorySchema.index({ parentCategory: 1, tenantId: 1 });

CategorySchema.pre('save', function (this: ICategory) {
    if (this.isModified('name')) {
        this.slug = generateSlug(this.name);
    }
});

CategorySchema.pre(/^find/, function (this: any) {
    if (this.getFilter().isDeleted === undefined) {
        this.where({ isDeleted: false });
    }
});

CategorySchema.virtual('subcategories', {
    ref: 'Category',
    localField: '_id',
    foreignField: 'parentCategory',
    justOne: false,
});

const Category = mongoose.model<ICategory>('Category', CategorySchema);
export default Category;
