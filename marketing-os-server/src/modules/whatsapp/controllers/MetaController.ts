import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { ApiResponse } from '../../../utils/apiResponse.js';

export function createMetaController(metaService: any) {
    return {
        getBusinessDetails: asyncHandler(async (req: Request, res: Response) => {
            const user = (req as any).user;
            const result = await metaService.getBusinessDetails(user.id);
            ApiResponse.success(res, result, 'Business details retrieved successfully');
        }),

        getConnectedAssets: asyncHandler(async (req: Request, res: Response) => {
            const user = (req as any).user;
            const businessId = req.query.businessId as string;

            // If no business ID provided, try to fetch the first business from details
            if (!businessId) {
                const details = await metaService.getBusinessDetails(user.id);
                if (details.data && details.data.length > 0) {
                    const bId = details.data[0].id;
                    const result = await metaService.getConnectedAssets(user.id, bId);
                    return ApiResponse.success(res, result, 'Connected assets retrieved successfully');
                } else {
                    return ApiResponse.success(res, { adAccounts: [], wabaAccounts: [] }, 'No businesses found');
                }
            } else {
                const result = await metaService.getConnectedAssets(user.id, businessId);
                ApiResponse.success(res, result, 'Connected assets retrieved successfully');
            }
        })
    };
}
