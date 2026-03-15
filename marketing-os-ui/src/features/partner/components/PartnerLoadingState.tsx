interface PartnerLoadingStateProps {
  title: string;
}

export function PartnerLoadingState({ title }: PartnerLoadingStateProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="animate-pulse rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <div className="h-4 w-24 rounded-full bg-slate-200" />
              <div className="mt-4 h-8 w-28 rounded-full bg-slate-200" />
              <div className="mt-3 h-4 w-32 rounded-full bg-slate-200" />
            </div>
          ))}
        </div>
      </div>

      <div className="animate-pulse rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
        <div className="h-5 w-40 rounded-full bg-slate-200" />
        <div className="mt-3 h-4 w-64 rounded-full bg-slate-200" />
        <div className="mt-8 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-12 rounded-2xl bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  );
}
