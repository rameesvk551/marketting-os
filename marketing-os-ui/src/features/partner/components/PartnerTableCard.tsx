import type { ReactNode } from 'react';

interface PartnerTableColumn<T> {
  header: string;
  render: (row: T) => ReactNode;
  cellClassName?: string;
}

interface PartnerTableCardProps<T extends { id: string }> {
  title: string;
  description: string;
  columns: PartnerTableColumn<T>[];
  rows: T[];
  emptyTitle: string;
  emptyDescription: string;
}

export function PartnerTableCard<T extends { id: string },>({
  title,
  description,
  columns,
  rows,
  emptyTitle,
  emptyDescription,
}: PartnerTableCardProps<T>) {
  return (
    <section className="rounded-[30px] border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
      <div className="border-b border-slate-200 px-6 py-5">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      {rows.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <h4 className="text-base font-semibold text-slate-900">{emptyTitle}</h4>
          <p className="mt-2 text-sm text-slate-500">{emptyDescription}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-50/80">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.header}
                    className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-slate-50/70">
                  {columns.map((column) => (
                    <td key={column.header} className={`px-6 py-4 align-top text-sm text-slate-600 ${column.cellClassName ?? ''}`}>
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
