import { Coins, CreditCard, DollarSign, Users } from 'lucide-react';
import { PartnerErrorState } from '../components/PartnerErrorState';
import { PartnerLoadingState } from '../components/PartnerLoadingState';
import { PartnerStatCard } from '../components/PartnerStatCard';
import { PartnerTableCard } from '../components/PartnerTableCard';
import { usePartnerDashboard } from '../hooks/usePartner';
import { formatCurrency, formatDate, formatNumber, formatPercent } from '../utils/format';

export default function PartnerDashboardPage() {
  const dashboardQuery = usePartnerDashboard();

  if (dashboardQuery.isLoading) {
    return <PartnerLoadingState title="Loading partner dashboard" />;
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <PartnerErrorState
        title="Unable to load the partner dashboard"
        description="Make sure your account maps to a partner record or provide a valid partner id in localStorage.partnerId."
      />
    );
  }

  const dashboard = dashboardQuery.data;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PartnerStatCard
          label="Total Customers"
          value={formatNumber(dashboard.totalCustomers)}
          hint="Businesses attributed to this partner"
          icon={<Users className="h-5 w-5" />}
        />
        <PartnerStatCard
          label="Total Revenue"
          value={formatCurrency(dashboard.totalRevenue)}
          hint={`Commission rate ${formatPercent(dashboard.partner.commissionRate)}`}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <PartnerStatCard
          label="Wallet Balance"
          value={formatCurrency(dashboard.walletBalance)}
          hint="Accumulated commission earnings"
          icon={<Coins className="h-5 w-5" />}
        />
        <PartnerStatCard
          label="Withdrawable Amount"
          value={formatCurrency(dashboard.withdrawableAmount)}
          hint={`${formatCurrency(dashboard.pendingWithdrawals)} pending review`}
          icon={<CreditCard className="h-5 w-5" />}
        />
      </section>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
        <PartnerTableCard
          title="Recent Customers"
          description="The latest businesses that signed up using your referral link."
          rows={dashboard.recentCustomers}
          emptyTitle="No referred customers yet"
          emptyDescription="Once someone signs up with your referral link, they will show up here."
          columns={[
            {
              header: 'Customer Name',
              render: (customer) => (
                <div>
                  <p className="font-medium text-slate-900">{customer.businessName}</p>
                  <p className="mt-1 text-xs text-slate-500">{customer.email}</p>
                </div>
              ),
            },
            {
              header: 'Plan',
              render: (customer) => (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                  {customer.plan}
                </span>
              ),
            },
            {
              header: 'Date Joined',
              render: (customer) => <span className="font-medium text-slate-700">{formatDate(customer.createdAt)}</span>,
            },
          ]}
        />

        <div className="space-y-6">
          <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Referral link</p>
            <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">Share this signup URL</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              New signups using this link will be attached to your partner profile automatically.
            </p>
            <div className="mt-5 rounded-[24px] bg-slate-50 p-4 text-sm font-medium text-slate-700 break-all">
              {dashboard.partner.referralLink}
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Recent withdrawals</p>
            <div className="mt-4 space-y-3">
              {dashboard.recentWithdrawRequests.length === 0 ? (
                <p className="rounded-[22px] bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  No withdrawal requests yet. Submit one when you are ready for payout.
                </p>
              ) : (
                dashboard.recentWithdrawRequests.map((request) => (
                  <div key={request.id} className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{formatCurrency(request.amount)}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatDate(request.createdAt)}</p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                        {request.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
