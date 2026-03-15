import { useState } from 'react';
import { Copy, Link2, Mail, Percent, Sparkles } from 'lucide-react';
import { PartnerErrorState } from '../components/PartnerErrorState';
import { PartnerLoadingState } from '../components/PartnerLoadingState';
import { usePartnerDashboard } from '../hooks/usePartner';
import { formatDate, formatPercent } from '../utils/format';

export default function PartnerSettingsPage() {
  const [copied, setCopied] = useState(false);
  const dashboardQuery = usePartnerDashboard();

  if (dashboardQuery.isLoading) {
    return <PartnerLoadingState title="Loading partner settings" />;
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <PartnerErrorState
        title="Unable to load partner settings"
        description="Partner identity details could not be loaded for the current workspace."
      />
    );
  }

  const partner = dashboardQuery.data.partner;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(partner.referralLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-slate-200 bg-white px-6 py-6 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Settings</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">Partner profile and referral settings</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Keep your referral details easy to access and ready to share with new prospects.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="mt-1 h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-sm font-medium text-slate-500">Partner email</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{partner.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Percent className="mt-1 h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-sm font-medium text-slate-500">Commission rate</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{formatPercent(partner.commissionRate)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Sparkles className="mt-1 h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-sm font-medium text-slate-500">Partner since</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{formatDate(partner.createdAt)}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
          <div className="flex items-center gap-3">
            <Link2 className="h-5 w-5 text-indigo-600" />
            <div>
              <p className="text-sm font-medium text-slate-500">Referral link</p>
              <p className="mt-1 text-base font-semibold text-slate-900">{partner.referralCode}</p>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] bg-slate-50 p-4 text-sm font-medium text-slate-700 break-all">
            {partner.referralLink}
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700"
          >
            <Copy className="h-4 w-4" />
            {copied ? 'Copied' : 'Copy referral link'}
          </button>
        </section>
      </div>
    </div>
  );
}
