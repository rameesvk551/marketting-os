import { useState } from 'react';
import { ArrowRight, Landmark, Wallet } from 'lucide-react';
import { PartnerErrorState } from '../components/PartnerErrorState';
import { PartnerLoadingState } from '../components/PartnerLoadingState';
import { PartnerTableCard } from '../components/PartnerTableCard';
import { useCreatePartnerWithdrawRequest, usePartnerDashboard } from '../hooks/usePartner';
import { formatCurrency, formatDate } from '../utils/format';

const getMutationErrorMessage = (error: unknown) => {
  const responseError = error as {
    response?: {
      data?: {
        message?: string;
      };
    };
  };

  return responseError.response?.data?.message || 'Unable to create the withdraw request right now.';
};

export default function PartnerWithdrawPage() {
  const [amount, setAmount] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const dashboardQuery = usePartnerDashboard();
  const withdrawMutation = useCreatePartnerWithdrawRequest();

  if (dashboardQuery.isLoading) {
    return <PartnerLoadingState title="Loading withdrawal workspace" />;
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <PartnerErrorState
        title="Unable to load withdrawal data"
        description="The payout workspace could not be loaded for the current partner context."
      />
    );
  }

  const dashboard = dashboardQuery.data;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessMessage(null);

    await withdrawMutation.mutateAsync(Number(amount));
    setSuccessMessage('Withdrawal request created. An admin can approve it manually from the back office.');
    setAmount('');
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Withdrawable amount</p>
              <p className="text-3xl font-semibold tracking-tight text-slate-900">{formatCurrency(dashboard.withdrawableAmount)}</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-500">
            Pending requests are held aside so you cannot request the same balance twice.
          </p>
        </div>

        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Pending withdrawals</p>
              <p className="text-3xl font-semibold tracking-tight text-slate-900">{formatCurrency(dashboard.pendingWithdrawals)}</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-500">
            Admin approval is manual, so pending requests remain visible until processed.
          </p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)]">
        <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Request withdrawal</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">Create a payout request</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Submit the amount you want to withdraw and the admin team can review and approve it manually.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Amount</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="250.00"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white"
                required
              />
            </label>

            <div className="rounded-[22px] bg-slate-50 px-4 py-4 text-sm text-slate-600">
              Available now: <span className="font-semibold text-slate-900">{formatCurrency(dashboard.withdrawableAmount)}</span>
            </div>

            {successMessage ? (
              <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
                {successMessage}
              </div>
            ) : null}

            {withdrawMutation.isError ? (
              <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-900">
                {getMutationErrorMessage(withdrawMutation.error)}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={withdrawMutation.isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {withdrawMutation.isPending ? 'Submitting request...' : 'Create withdraw request'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </section>

        <PartnerTableCard
          title="Recent Requests"
          description="Keep an eye on your latest payout submissions and their approval status."
          rows={dashboard.recentWithdrawRequests}
          emptyTitle="No withdrawal requests yet"
          emptyDescription="Your payout requests will appear here after you create one."
          columns={[
            {
              header: 'Amount',
              render: (request) => <span className="font-semibold text-slate-900">{formatCurrency(request.amount)}</span>,
            },
            {
              header: 'Status',
              render: (request) => (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                  {request.status}
                </span>
              ),
            },
            {
              header: 'Created At',
              render: (request) => <span className="font-medium text-slate-700">{formatDate(request.createdAt)}</span>,
            },
          ]}
        />
      </div>
    </div>
  );
}
