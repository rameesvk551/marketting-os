import { PartnerErrorState } from '../components/PartnerErrorState';
import { PartnerLoadingState } from '../components/PartnerLoadingState';
import { PartnerTableCard } from '../components/PartnerTableCard';
import { usePartnerCustomers } from '../hooks/usePartner';
import { formatDate } from '../utils/format';

export default function PartnerCustomersPage() {
  const customersQuery = usePartnerCustomers();

  if (customersQuery.isLoading) {
    return <PartnerLoadingState title="Loading referred customers" />;
  }

  if (customersQuery.isError || !customersQuery.data) {
    return (
      <PartnerErrorState
        title="Unable to load referred customers"
        description="The customers list could not be fetched for the current partner context."
      />
    );
  }

  const customers = customersQuery.data;

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-slate-200 bg-white px-6 py-6 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Customers</p>
        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">All referred businesses</h2>
            <p className="mt-2 text-sm text-slate-500">
              Every customer that signed up through your referral channel appears here.
            </p>
          </div>
          <div className="rounded-[22px] bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
            {customers.length} customer{customers.length === 1 ? '' : 's'}
          </div>
        </div>
      </section>

      <PartnerTableCard
        title="Customer Directory"
        description="Use this list to validate referral attribution and plan adoption."
        rows={customers}
        emptyTitle="No customers linked yet"
        emptyDescription="Your customer table will populate once referred businesses register."
        columns={[
          {
            header: 'Customer',
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
    </div>
  );
}
