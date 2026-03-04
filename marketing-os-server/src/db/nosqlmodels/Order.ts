import mongoose, { Schema, Document, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// ── Sub-document interface ──
export interface IOrderProduct {
    product: Types.ObjectId;
    productName: string;
    quantity: number;
    price: number;
}

// ── Order Document Interface ──
export interface IOrder extends Document {
    orderId: string;
    customerName: string;
    phoneNumber: string;
    products: IOrderProduct[];
    totalAmount: number;
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
    orderStatus: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
    notes: string;
    source: 'whatsapp' | 'product-link' | 'manual';
    tenantId: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

// ── Order Product Sub-schema ──
const OrderProductSchema = new Schema<IOrderProduct>(
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

// ── Schema Definition ──
const OrderSchema = new Schema<IOrder>(
    {
        orderId: {
            type: String,
            unique: true,
        },
        customerName: {
            type: String,
            required: [true, 'Customer name is required'],
            trim: true,
        },
        phoneNumber: {
            type: String,
            required: [true, 'Phone number is required'],
            trim: true,
        },
        products: {
            type: [OrderProductSchema],
            required: true,
            validate: {
                validator: (v: IOrderProduct[]) => v.length > 0,
                message: 'Order must contain at least one product',
            },
        },
        totalAmount: {
            type: Number,
            required: true,
            min: [0, 'Total amount cannot be negative'],
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded'],
            default: 'pending',
        },
        orderStatus: {
            type: String,
            enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
            default: 'pending',
        },
        notes: {
            type: String,
            default: '',
        },
        source: {
            type: String,
            enum: ['whatsapp', 'product-link', 'manual'],
            default: 'manual',
        },
        tenantId: {
            type: String,
            required: [true, 'Tenant ID is required'],
            index: true,
        },
        createdBy: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    },
);

// ── Indexes ──
OrderSchema.index({ orderId: 1, tenantId: 1 }, { unique: true });
OrderSchema.index({ orderStatus: 1, tenantId: 1 });
OrderSchema.index({ paymentStatus: 1, tenantId: 1 });
OrderSchema.index({ phoneNumber: 1, tenantId: 1 });

// ── Pre-save: auto-generate orderId ──
OrderSchema.pre('save', function (this: IOrder) {
    if (this.isNew && !this.orderId) {
        this.orderId = `ORD-${uuidv4().substring(0, 8).toUpperCase()}`;
    }
});

const Order = mongoose.model<IOrder>('Order', OrderSchema);
export default Order;
