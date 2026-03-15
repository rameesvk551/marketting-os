import type { ReactNode } from 'react';

interface PartnerStatCardProps {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
}

export function PartnerStatCard({ label, value, hint, icon }: PartnerStatCardProps) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{hint}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          {icon}
        </div>
      </div>
    </div>
  );
}
