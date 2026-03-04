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

export interface IProduct extends Document {
    productName: string;
    slug: string;
    description: string;
    shortDescription: string;
    price: number;
    discountPrice?: number;
    currency: string;
    sku: string;
    stockQuantity: number;
    images: string[];
    category: Types.ObjectId;
    tags: string[];
    status: 'active' | 'draft' | 'out-of-stock';
    isFeatured: boolean;
    isDeleted: boolean;
    views: number;
    clicks: number;
    createdBy: string;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
    {
        productName: {
            type: String,
            required: [true, 'Product name is required'],
            trim: true,
            maxlength: [200, 'Product name cannot exceed 200 characters'],
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
        },
        shortDescription: {
            type: String,
            default: '',
            maxlength: [300, 'Short description cannot exceed 300 characters'],
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: [0, 'Price cannot be negative'],
        },
        discountPrice: {
            type: Number,
            min: [0, 'Discount price cannot be negative'],
            validate: {
                validator: function (this: IProduct, value: number) {
                    return value < this.price;
                },
                message: 'Discount price must be less than regular price',
            },
        },
        currency: {
            type: String,
            default: 'INR',
        },
        sku: {
            type: String,
            default: '',
            trim: true,
        },
        stockQuantity: {
            type: Number,
            required: true,
            default: 0,
            min: [0, 'Stock cannot be negative'],
        },
        images: {
            type: [String],
            default: [],
        },
        category: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            required: [true, 'Product must belong to a category'],
        },
        tags: {
            type: [String],
            default: [],
            index: true,
        },
        status: {
            type: String,
            enum: ['active', 'draft', 'out-of-stock'],
            default: 'draft',
        },
        isFeatured: {
            type: Boolean,
            default: false,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        views: {
            type: Number,
            default: 0,
        },
        clicks: {
            type: Number,
            default: 0,
        },
        createdBy: {
            type: String,
            required: true,
        },
        tenantId: {
            type: String,
            required: [true, 'Tenant ID is required'],
            index: true,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

ProductSchema.index({ slug: 1, tenantId: 1 }, { unique: true });
ProductSchema.index({ status: 1, tenantId: 1 });
ProductSchema.index({ category: 1, tenantId: 1 });
ProductSchema.index({ sku: 1, tenantId: 1 });
ProductSchema.index({
    productName: 'text',
    description: 'text',
    tags: 'text',
});

ProductSchema.pre('save', function (this: IProduct) {
    if (this.isModified('productName')) {
        this.slug = generateSlug(this.productName);
    }
    if (this.stockQuantity <= 0 && this.status === 'active') {
        this.status = 'out-of-stock';
    }
});

ProductSchema.pre(/^find/, function (this: any) {
    if (this.getFilter().isDeleted === undefined) {
        this.where({ isDeleted: false });
    }
});

ProductSchema.virtual('effectivePrice').get(function () {
    return this.discountPrice ? this.discountPrice : this.price;
});

const Product = mongoose.model<IProduct>('Product', ProductSchema);
export default Product;
