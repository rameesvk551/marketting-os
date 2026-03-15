interface PartnerErrorStateProps {
  title: string;
  description: string;
}

export function PartnerErrorState({ title, description }: PartnerErrorStateProps) {
  return (
    <div className="rounded-[28px] border border-rose-200 bg-rose-50 px-6 py-8 text-rose-900 shadow-sm shadow-rose-100">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-2xl text-sm text-rose-700">{description}</p>
    </div>
  );
}
