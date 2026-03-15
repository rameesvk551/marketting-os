import { Outlet } from 'react-router-dom';
import { PartnerSidebar } from '../components/PartnerSidebar';
import { usePartnerDashboard } from '../hooks/usePartner';

export default function PartnerLayout() {
  const dashboardQuery = usePartnerDashboard();
  const partner = dashboardQuery.data?.partner;
  const errorMessage = dashboardQuery.isError
    ? 'Partner data could not be resolved. Log in with a partner email or set localStorage.partnerId to a valid partner id.'
    : undefined;

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-indigo-100 bg-[radial-gradient(circle_at_top_left,_rgba(79,70,229,0.14),_transparent_32%),linear-gradient(135deg,_#ffffff_0%,_#f8faff_52%,_#f3f4f6_100%)] px-6 py-7 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-indigo-600">Partner dashboard</p>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Grow revenue with a clean partner workspace.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Monitor referred customers, commission earnings, and payout requests in one simple place built to scale with your SaaS partner program.
            </p>
          </div>
          <div className="rounded-[24px] border border-white/70 bg-white/85 px-5 py-4 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Current partner</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{partner?.name ?? 'Resolve partner context'}</p>
            <p className="mt-1 text-sm text-slate-500">{partner?.referralCode ?? 'No referral code loaded yet'}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <PartnerSidebar partner={partner} errorMessage={errorMessage} />
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
