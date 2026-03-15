import client from '../../../api/client';
import type {
  ApiEnvelope,
  PartnerCommission,
  PartnerCustomer,
  PartnerDashboard,
  PartnerWithdrawRequest,
} from '../types';

const PARTNER_BASE = '/partner';

const getPartnerContext = () => {
  const partnerId = localStorage.getItem('partnerId');
  return partnerId ? { partnerId } : undefined;
};

export const partnerService = {
  async getDashboard(): Promise<PartnerDashboard> {
    const { data } = await client.get<ApiEnvelope<PartnerDashboard>>(`${PARTNER_BASE}/dashboard`, {
      params: getPartnerContext(),
    });

    return data.data;
  },

  async getCustomers(): Promise<PartnerCustomer[]> {
    const { data } = await client.get<ApiEnvelope<PartnerCustomer[]>>(`${PARTNER_BASE}/customers`, {
      params: getPartnerContext(),
    });

    return data.data;
  },

  async getCommissions(): Promise<PartnerCommission[]> {
    const { data } = await client.get<ApiEnvelope<PartnerCommission[]>>(`${PARTNER_BASE}/commissions`, {
      params: getPartnerContext(),
    });

    return data.data;
  },

  async createWithdrawRequest(amount: number): Promise<PartnerWithdrawRequest> {
    const { data } = await client.post<ApiEnvelope<PartnerWithdrawRequest>>(`${PARTNER_BASE}/withdraw`, {
      amount,
      ...getPartnerContext(),
    });

    return data.data;
  },
};
