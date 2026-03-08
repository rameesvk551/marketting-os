import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICartItem {
    product: Types.ObjectId;
    productName: string;
    quantity: number;
    price: number;
}

export interface ICart extends Document {
    userId: string; // Phone number or connection ID
    tenantId: string;
    items: ICartItem[];
    status: 'active' | 'abandoned' | 'completed';
    createdAt: Date;
    updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>(
    {
        product: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        productName: {
            type: String,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: [1, 'Quantity must be at least 1'],
        },
        price: {
            type: Number,
            required: true,
            min: [0, 'Price cannot be negative'],
        },
    },
    { _id: false },
);

const CartSchema = new Schema<ICart>(
    {
        userId: {
            type: String,
            required: [true, 'User ID (phone number) is required'],
            index: true,
        },
        tenantId: {
            type: String,
            required: [true, 'Tenant ID is required'],
            index: true,
        },
        items: {
            type: [CartItemSchema],
            default: [],
        },
        status: {
            type: String,
            enum: ['active', 'abandoned', 'completed'],
            default: 'active',
            index: true,
        },
    },
    {
        timestamps: true,
    },
);

CartSchema.index({ userId: 1, tenantId: 1, status: 1 });

const Cart = mongoose.model<ICart>('Cart', CartSchema);
export default Cart;
