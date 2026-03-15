import mongoose, { HydratedDocument, Schema, Types } from 'mongoose';

const generateReferralCode = (name: string): string => {
    const prefix = name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 6) || 'PARTNR';

    return `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;
};

export interface IPartner {
    name: string;
    email: string;
    commissionRate: number;
    walletBalance: number;
    totalCustomers: number;
    totalRevenue: number;
    referralCode: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IPartnerCustomer {
    businessName: string;
    email: string;
    partnerId: Types.ObjectId;
    tenantId?: string;
    plan: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IWithdrawRequest {
    partnerId: Types.ObjectId;
    amount: number;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Date;
    updatedAt: Date;
}

const PartnerSchema = new Schema<IPartner>(
    {
        name: {
            type: String,
            required: [true, 'Partner name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Partner email is required'],
            trim: true,
            lowercase: true,
            unique: true,
        },
        commissionRate: {
            type: Number,
            required: [true, 'Commission rate is required'],
            min: [0, 'Commission rate cannot be negative'],
            max: [1, 'Commission rate cannot exceed 1'],
        },
        walletBalance: {
            type: Number,
            default: 0,
            min: [0, 'Wallet balance cannot be negative'],
        },
        totalCustomers: {
            type: Number,
            default: 0,
            min: [0, 'Total customers cannot be negative'],
        },
        totalRevenue: {
            type: Number,
            default: 0,
            min: [0, 'Total revenue cannot be negative'],
        },
        referralCode: {
            type: String,
            unique: true,
            trim: true,
            uppercase: true,
        },
    },
    {
        timestamps: true,
    },
);

PartnerSchema.pre('validate', function (this: HydratedDocument<IPartner>) {
    this.email = this.email.toLowerCase().trim();

    if (this.isNew && !this.referralCode) {
        this.referralCode = generateReferralCode(this.name);
    }
});

PartnerSchema.index({ referralCode: 1 }, { unique: true });

const PartnerCustomerSchema = new Schema<IPartnerCustomer>(
    {
        businessName: {
            type: String,
            required: [true, 'Business name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Customer email is required'],
            trim: true,
            lowercase: true,
        },
        partnerId: {
            type: Schema.Types.ObjectId,
            ref: 'Partner',
            required: [true, 'Partner is required'],
            index: true,
        },
        tenantId: {
            type: String,
            index: true,
        },
        plan: {
            type: String,
            required: [true, 'Plan is required'],
            trim: true,
        },
    },
    {
        timestamps: true,
    },
);

PartnerCustomerSchema.pre('save', function (this: HydratedDocument<IPartnerCustomer>) {
    this.email = this.email.toLowerCase().trim();
});

PartnerCustomerSchema.index({ email: 1 });
PartnerCustomerSchema.index({ tenantId: 1 }, { sparse: true });
PartnerCustomerSchema.index({ partnerId: 1, createdAt: -1 });

const WithdrawRequestSchema = new Schema<IWithdrawRequest>(
    {
        partnerId: {
            type: Schema.Types.ObjectId,
            ref: 'Partner',
            required: [true, 'Partner is required'],
            index: true,
        },
        amount: {
            type: Number,
            required: [true, 'Withdrawal amount is required'],
            min: [0.01, 'Withdrawal amount must be greater than zero'],
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
            index: true,
        },
    },
    {
        timestamps: true,
    },
);

WithdrawRequestSchema.index({ partnerId: 1, status: 1, createdAt: -1 });

export const PartnerModel =
    (mongoose.models.Partner as mongoose.Model<IPartner> | undefined) ||
    mongoose.model<IPartner>('Partner', PartnerSchema);

export const PartnerCustomerModel =
    (mongoose.models.PartnerCustomer as mongoose.Model<IPartnerCustomer> | undefined) ||
    mongoose.model<IPartnerCustomer>('PartnerCustomer', PartnerCustomerSchema);

export const WithdrawRequestModel =
    (mongoose.models.WithdrawRequest as mongoose.Model<IWithdrawRequest> | undefined) ||
    mongoose.model<IWithdrawRequest>('WithdrawRequest', WithdrawRequestSchema);
