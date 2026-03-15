export interface PartnerSummary {
  id: string;
  name: string;
  email: string;
  commissionRate: number;
  referralCode: string;
  referralLink: string;
  createdAt: string;
}

export interface PartnerCustomer {
  id: string;
  businessName: string;
  email: string;
  plan: string;
  createdAt: string;
}

export interface PartnerCommissionCustomer {
  id: string;
  businessName: string;
  email: string;
  plan: string;
}

export interface PartnerCommission {
  id: string;
  amount: number;
  createdAt: string;
  customer: PartnerCommissionCustomer | null;
}

export interface PartnerWithdrawRequest {
  id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface PartnerDashboard {
  partner: PartnerSummary;
  totalCustomers: number;
  totalRevenue: number;
  walletBalance: number;
  withdrawableAmount: number;
  pendingWithdrawals: number;
  recentCustomers: PartnerCustomer[];
  recentWithdrawRequests: PartnerWithdrawRequest[];
}

export interface ApiEnvelope<T> {
  status: string;
  message: string;
  data: T;
}
