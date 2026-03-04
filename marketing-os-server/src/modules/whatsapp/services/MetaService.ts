import axios from 'axios';
import { AppError } from '../../../utils/apiError.js';
import db from '../../../db/sqlmodels/index.js';

export function createMetaService() {
    return {
        async getBusinessDetails(userId: string) {
            const user = await db.User.findByPk(userId);
            if (!user || !user.metaAccessToken) {
                throw new AppError('Meta account not linked or access token missing', 400);
            }

            try {
                // Fetch businesses the user has access to
                const response = await axios.get(`https://graph.facebook.com/v21.0/me/businesses`, {
                    params: { access_token: user.metaAccessToken }
                });
                return response.data;
            } catch (error: any) {
                throw new AppError(error.response?.data?.error?.message || 'Failed to fetch business details', 400);
            }
        },

        async getConnectedAssets(userId: string, businessId: string) {
            const user = await db.User.findByPk(userId);
            if (!user || !user.metaAccessToken) {
                throw new AppError('Meta account not linked or access token missing', 400);
            }

            try {
                // Fetch ad accounts for this business
                const response = await axios.get(`https://graph.facebook.com/v21.0/${businessId}/client_ad_accounts`, {
                    params: { access_token: user.metaAccessToken }
                });

                // Fetch WABAs for this business
                const wabaResponse = await axios.get(`https://graph.facebook.com/v21.0/${businessId}/owned_whatsapp_business_accounts`, {
                    params: { access_token: user.metaAccessToken }
                });

                return {
                    adAccounts: response.data.data || [],
                    wabaAccounts: wabaResponse.data.data || []
                };
            } catch (error: any) {
                throw new AppError(error.response?.data?.error?.message || 'Failed to fetch connected assets', 400);
            }
        }
    };
}
