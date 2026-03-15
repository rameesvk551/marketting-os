import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import * as partnerService from './partner.service.js';

const extractPartnerId = (req: Request): string | undefined => {
    const headerValue = req.header('x-partner-id');
    const queryValue = typeof req.query.partnerId === 'string' ? req.query.partnerId : undefined;
    const bodyValue = typeof req.body?.partnerId === 'string' ? req.body.partnerId : undefined;

    return headerValue || queryValue || bodyValue;
};

const resolveRequestPartner = async (req: Request) => {
    return partnerService.resolvePartnerContext({
        explicitPartnerId: extractPartnerId(req),
        userId: req.user?.id,
    });
};

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
    const partner = await resolveRequestPartner(req);
    const dashboard = await partnerService.getPartnerDashboard(partner.id);

    ApiResponse.success(res, dashboard, 'Partner dashboard fetched successfully');
});

export const getCustomers = asyncHandler(async (req: Request, res: Response) => {
    const partner = await resolveRequestPartner(req);
    const customers = await partnerService.getPartnerCustomers(partner.id);

    ApiResponse.success(res, customers, 'Partner customers fetched successfully');
});

export const getCommissions = asyncHandler(async (req: Request, res: Response) => {
    const partner = await resolveRequestPartner(req);
    const commissions = await partnerService.getPartnerCommissions(partner.id);

    ApiResponse.success(res, commissions, 'Partner commissions fetched successfully');
});

export const withdraw = asyncHandler(async (req: Request, res: Response) => {
    const partner = await resolveRequestPartner(req);
    const amount = typeof req.body.amount === 'string' ? Number(req.body.amount) : Number(req.body.amount);
    const withdrawRequest = await partnerService.createWithdrawRequest(partner.id, amount);

    ApiResponse.created(res, withdrawRequest, 'Withdraw request created successfully');
});
