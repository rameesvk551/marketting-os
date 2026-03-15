import { PartnerErrorState } from '../components/PartnerErrorState';
import { PartnerLoadingState } from '../components/PartnerLoadingState';
import { PartnerTableCard } from '../components/PartnerTableCard';
import { usePartnerCommissions } from '../hooks/usePartner';
import { formatCurrency, formatDate } from '../utils/format';

export default function PartnerCommissionsPage() {
  const commissionsQuery = usePartnerCommissions();

  if (commissionsQuery.isLoading) {
    return <PartnerLoadingState title="Loading commission history" />;
  }

  if (commissionsQuery.isError || !commissionsQuery.data) {
    return (
      <PartnerErrorState
        title="Unable to load commission history"
        description="Commission records could not be fetched for the current partner context."
      />
    );
  }

  const commissions = commissionsQuery.data;

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-slate-200 bg-white px-6 py-6 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Commissions</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">Commission timeline</h2>
        <p className="mt-2 text-sm text-slate-500">
          Every subscription payment tied to your referred customers creates a commission record here.
        </p>
      </section>

      <PartnerTableCard
        title="Commission History"
        description="Track exactly which customers generated earnings and when."
        rows={commissions}
        emptyTitle="No commission records yet"
        emptyDescription="Commission entries will appear after a referred customer completes a payment."
        columns={[
          {
            header: 'Customer',
            render: (commission) => (
              <div>
                <p className="font-medium text-slate-900">{commission.customer?.businessName ?? 'Unknown customer'}</p>
                <p className="mt-1 text-xs text-slate-500">{commission.customer?.email ?? 'No linked email'}</p>
              </div>
            ),
          },
          {
            header: 'Plan',
            render: (commission) => (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                {commission.customer?.plan ?? 'N/A'}
              </span>
            ),
          },
          {
            header: 'Amount',
            render: (commission) => <span className="font-semibold text-slate-900">{formatCurrency(commission.amount)}</span>,
          },
          {
            header: 'Created At',
            render: (commission) => <span className="font-medium text-slate-700">{formatDate(commission.createdAt)}</span>,
          },
        ]}
      />
    </div>
  );
}
