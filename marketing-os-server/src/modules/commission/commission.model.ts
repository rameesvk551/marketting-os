import mongoose, { Schema, Types } from 'mongoose';

export interface ICommission {
    partnerId: Types.ObjectId;
    customerId: Types.ObjectId;
    amount: number;
    createdAt: Date;
    updatedAt: Date;
}

const CommissionSchema = new Schema<ICommission>(
    {
        partnerId: {
            type: Schema.Types.ObjectId,
            ref: 'Partner',
            required: [true, 'Partner is required'],
            index: true,
        },
        customerId: {
            type: Schema.Types.ObjectId,
            ref: 'PartnerCustomer',
            required: [true, 'Customer is required'],
            index: true,
        },
        amount: {
            type: Number,
            required: [true, 'Commission amount is required'],
            min: [0, 'Commission amount cannot be negative'],
        },
    },
    {
        timestamps: true,
    },
);

CommissionSchema.index({ partnerId: 1, createdAt: -1 });
CommissionSchema.index({ customerId: 1, createdAt: -1 });

export const CommissionModel =
    (mongoose.models.Commission as mongoose.Model<ICommission> | undefined) ||
    mongoose.model<ICommission>('Commission', CommissionSchema);
