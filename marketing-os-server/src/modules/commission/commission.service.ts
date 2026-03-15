import mongoose from 'mongoose';
import { ValidationError, NotFoundError } from '../../utils/apiError.js';
import { PartnerCustomerModel, PartnerModel, type IPartnerCustomer } from '../partner/partner.model.js';
import { CommissionModel } from './commission.model.js';

interface RecordCommissionFromPaymentInput {
    customerId?: string;
    customerEmail?: string;
    customerTenantId?: string;
    paymentAmount: number;
}

const mapCommissionRecord = (
    commission: {
        id: string;
        amount: number;
        createdAt: Date;
    },
    customer: {
        id: string;
        businessName: string;
        email: string;
        plan: string;
    } | null,
) => ({
    id: commission.id,
    amount: commission.amount,
    createdAt: commission.createdAt,
    customer,
});

const resolveCustomer = async ({
    customerId,
    customerEmail,
    customerTenantId,
}: Omit<RecordCommissionFromPaymentInput, 'paymentAmount'>) => {
    if (customerId) {
        if (!mongoose.isValidObjectId(customerId)) {
            throw new ValidationError('Invalid customer id', {
                customerId: ['Customer id must be a valid Mongo ObjectId'],
            });
        }

        return PartnerCustomerModel.findById(customerId);
    }

    if (customerTenantId) {
        return PartnerCustomerModel.findOne({ tenantId: customerTenantId });
    }

    if (customerEmail) {
        return PartnerCustomerModel.findOne({ email: customerEmail.toLowerCase().trim() });
    }

    throw new ValidationError('Customer context is required to record a commission', {
        customer: ['Provide customerId, customerEmail, or customerTenantId'],
    });
};

export const calculateCommission = (paymentAmount: number, commissionRate: number): number => {
    return Number((paymentAmount * commissionRate).toFixed(2));
};

export const recordCommissionFromPayment = async ({
    customerId,
    customerEmail,
    customerTenantId,
    paymentAmount,
}: RecordCommissionFromPaymentInput) => {
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
        throw new ValidationError('Payment amount must be greater than zero', {
            paymentAmount: ['Provide a valid positive payment amount'],
        });
    }

    const customer = await resolveCustomer({ customerId, customerEmail, customerTenantId });

    if (!customer?.partnerId) {
        return {
            awarded: false,
            reason: 'Customer is not linked to a partner.',
        };
    }

    const partner = await PartnerModel.findById(customer.partnerId);
    if (!partner) {
        throw new NotFoundError('Partner', customer.partnerId.toString());
    }

    const commissionAmount = calculateCommission(paymentAmount, partner.commissionRate);
    const commission = await CommissionModel.create({
        partnerId: partner._id,
        customerId: customer._id,
        amount: commissionAmount,
    });

    partner.walletBalance = Number((partner.walletBalance + commissionAmount).toFixed(2));
    partner.totalRevenue = Number((partner.totalRevenue + paymentAmount).toFixed(2));
    await partner.save();

    return {
        awarded: true,
        commission: mapCommissionRecord(
            {
                id: commission.id,
                amount: commission.amount,
                createdAt: commission.createdAt,
            },
            {
                id: customer.id,
                businessName: customer.businessName,
                email: customer.email,
                plan: customer.plan,
            },
        ),
    };
};

export const getPartnerCommissionHistory = async (partnerId: string) => {
    const commissions = await CommissionModel.find({ partnerId })
        .populate('customerId', 'businessName email plan createdAt')
        .sort({ createdAt: -1 });

    return commissions.map((commission) => {
        const customer = commission.customerId as unknown as (IPartnerCustomer & {
            _id: mongoose.Types.ObjectId;
        }) | null;

        return mapCommissionRecord(
            {
                id: commission.id,
                amount: commission.amount,
                createdAt: commission.createdAt,
            },
            customer
                ? {
                    id: customer._id.toString(),
                    businessName: customer.businessName,
                    email: customer.email,
                    plan: customer.plan,
                }
                : null,
        );
    });
};
