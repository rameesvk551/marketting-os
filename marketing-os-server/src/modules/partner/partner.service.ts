import mongoose from 'mongoose';
import { getPartnerCommissionHistory } from '../commission/commission.service.js';
import { ValidationError, NotFoundError } from '../../utils/apiError.js';
import * as authRepository from '../auth/auth.repository.js';
import {
    PartnerCustomerModel,
    PartnerModel,
    WithdrawRequestModel,
    type IPartner,
} from './partner.model.js';

interface ResolvePartnerContextInput {
    explicitPartnerId?: string;
    userId?: string;
}

interface RegisterReferredCustomerInput {
    businessName: string;
    email: string;
    partnerId: string;
    tenantId?: string;
    plan?: string;
}

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const mapPartnerSummary = (partner: IPartner & { id: string }) => ({
    id: partner.id,
    name: partner.name,
    email: partner.email,
    commissionRate: partner.commissionRate,
    referralCode: partner.referralCode,
    referralLink: `${FRONTEND_URL}/signup?ref=${partner.referralCode}`,
    createdAt: partner.createdAt,
});

const mapCustomer = (customer: {
    id: string;
    businessName: string;
    email: string;
    plan: string;
    createdAt: Date;
}) => ({
    id: customer.id,
    businessName: customer.businessName,
    email: customer.email,
    plan: customer.plan,
    createdAt: customer.createdAt,
});

const mapWithdrawRequest = (request: {
    id: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Date;
}) => ({
    id: request.id,
    amount: request.amount,
    status: request.status,
    createdAt: request.createdAt,
});

const getPendingWithdrawals = async (partnerId: string): Promise<number> => {
    const [pendingRecord] = await WithdrawRequestModel.aggregate<{ totalPending: number }>([
        {
            $match: {
                partnerId: new mongoose.Types.ObjectId(partnerId),
                status: 'pending',
            },
        },
        {
            $group: {
                _id: null,
                totalPending: { $sum: '$amount' },
            },
        },
    ]);

    return pendingRecord?.totalPending ?? 0;
};

const getPartnerOrThrow = async (partnerId: string) => {
    if (!mongoose.isValidObjectId(partnerId)) {
        throw new ValidationError('Invalid partner id', {
            partnerId: ['Partner id must be a valid Mongo ObjectId'],
        });
    }

    const partner = await PartnerModel.findById(partnerId);
    if (!partner) {
        throw new NotFoundError('Partner', partnerId);
    }

    return partner;
};

const resolvePartnerByUserId = async (userId?: string) => {
    if (!userId) {
        return null;
    }

    const user = await authRepository.findUserById(userId);
    if (!user?.email) {
        return null;
    }

    return PartnerModel.findOne({ email: user.email.toLowerCase().trim() });
};

export const resolvePartnerByReferralCode = async (referralCode: string) => {
    return PartnerModel.findOne({ referralCode: referralCode.toUpperCase().trim() });
};

export const resolvePartnerContext = async ({ explicitPartnerId, userId }: ResolvePartnerContextInput) => {
    if (explicitPartnerId) {
        return getPartnerOrThrow(explicitPartnerId);
    }

    const partner = await resolvePartnerByUserId(userId);
    if (partner) {
        return partner;
    }

    throw new ValidationError('Partner context is required', {
        partnerId: ['Provide x-partner-id, partnerId query param, or authenticate as a partner email.'],
    });
};

export const registerReferredCustomer = async ({
    businessName,
    email,
    partnerId,
    tenantId,
    plan = 'trial',
}: RegisterReferredCustomerInput) => {
    const normalizedEmail = email.toLowerCase().trim();

    const existingCustomer = tenantId
        ? await PartnerCustomerModel.findOne({ tenantId })
        : await PartnerCustomerModel.findOne({ email: normalizedEmail });

    if (existingCustomer) {
        if (!existingCustomer.tenantId && tenantId) {
            existingCustomer.tenantId = tenantId;
        }

        if (existingCustomer.plan !== plan) {
            existingCustomer.plan = plan;
        }

        await existingCustomer.save();
        return existingCustomer;
    }

    const customer = await PartnerCustomerModel.create({
        businessName,
        email: normalizedEmail,
        partnerId,
        tenantId,
        plan,
    });

    await PartnerModel.findByIdAndUpdate(partnerId, {
        $inc: { totalCustomers: 1 },
    });

    return customer;
};

export const getPartnerDashboard = async (partnerId: string) => {
    const partner = await getPartnerOrThrow(partnerId);
    const [recentCustomers, recentWithdrawRequests, pendingWithdrawals] = await Promise.all([
        PartnerCustomerModel.find({ partnerId })
            .sort({ createdAt: -1 })
            .limit(5),
        WithdrawRequestModel.find({ partnerId })
            .sort({ createdAt: -1 })
            .limit(5),
        getPendingWithdrawals(partnerId),
    ]);

    return {
        partner: mapPartnerSummary(partner as IPartner & { id: string }),
        totalCustomers: partner.totalCustomers,
        totalRevenue: partner.totalRevenue,
        walletBalance: partner.walletBalance,
        withdrawableAmount: Math.max(Number((partner.walletBalance - pendingWithdrawals).toFixed(2)), 0),
        pendingWithdrawals,
        recentCustomers: recentCustomers.map(mapCustomer),
        recentWithdrawRequests: recentWithdrawRequests.map(mapWithdrawRequest),
    };
};

export const getPartnerCustomers = async (partnerId: string) => {
    await getPartnerOrThrow(partnerId);

    const customers = await PartnerCustomerModel.find({ partnerId }).sort({ createdAt: -1 });
    return customers.map(mapCustomer);
};

export const getPartnerCommissions = async (partnerId: string) => {
    await getPartnerOrThrow(partnerId);
    return getPartnerCommissionHistory(partnerId);
};

export const createWithdrawRequest = async (partnerId: string, amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0) {
        throw new ValidationError('Withdrawal amount must be greater than zero', {
            amount: ['Provide a valid positive amount'],
        });
    }

    const partner = await getPartnerOrThrow(partnerId);
    const pendingWithdrawals = await getPendingWithdrawals(partnerId);
    const withdrawableAmount = Math.max(Number((partner.walletBalance - pendingWithdrawals).toFixed(2)), 0);

    if (amount > withdrawableAmount) {
        throw new ValidationError('Withdrawal amount exceeds available balance', {
            amount: [`Maximum withdrawable amount is ${withdrawableAmount.toFixed(2)}`],
        });
    }

    const withdrawRequest = await WithdrawRequestModel.create({
        partnerId,
        amount: Number(amount.toFixed(2)),
        status: 'pending',
    });

    return mapWithdrawRequest(withdrawRequest);
};
