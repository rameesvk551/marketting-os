import { Link2, LayoutDashboard, Settings, Users, WalletCards, WalletMinimal } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import type { PartnerSummary } from '../types';

interface PartnerSidebarProps {
  partner?: PartnerSummary;
  errorMessage?: string;
}

const navItems = [
  { to: '/partner', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/partner/customers', label: 'Customers', icon: Users },
  { to: '/partner/commissions', label: 'Commissions', icon: WalletCards },
  { to: '/partner/withdraw', label: 'Withdraw', icon: WalletMinimal },
  { to: '/partner/settings', label: 'Settings', icon: Settings },
];

export function PartnerSidebar({ partner, errorMessage }: PartnerSidebarProps) {
  return (
    <aside className="h-fit rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 xl:sticky xl:top-24">
      <div className="rounded-[24px] bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Partner</p>
        <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">
          {partner?.name ?? 'Partner workspace'}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {partner?.email ?? 'Track referred customers, payouts, and commission performance.'}
        </p>
      </div>

      <nav className="mt-5 space-y-2">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-5 rounded-[24px] border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Link2 className="h-4 w-4 text-indigo-600" />
          Referral code
        </div>
        <p className="mt-3 rounded-2xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
          {partner?.referralCode ?? 'Pending resolution'}
        </p>
        <p className="mt-3 text-xs leading-5 text-slate-500">
          Share your signup link and every referred customer will appear here automatically.
        </p>
      </div>

      {errorMessage ? (
        <div className="mt-5 rounded-[22px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {errorMessage}
        </div>
      ) : null}
    </aside>
  );
}
