import { CalendarClock, Eye, MessageCircle, Pencil, Phone, UserRound } from 'lucide-react';
import type { LeadRecord } from '../data/leads';
import { StatusBadge } from './StatusBadge';
import { useResponsive } from '../../../hooks/useResponsive';

interface LeadsTableProps {
    leads: LeadRecord[];
    onViewLead: (lead: LeadRecord) => void;
    onEditLead: (lead: LeadRecord) => void;
    onWhatsAppLead: (lead: LeadRecord) => void;
    isSelected?: (id: string) => boolean;
    onToggleSelect?: (id: string) => void;
    onSelectAll?: () => void;
    onClearAll?: () => void;
}

const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

export function LeadsTable({
    leads,
    onViewLead,
    onEditLead,
    onWhatsAppLead,
    isSelected,
    onToggleSelect,
    onSelectAll,
    onClearAll,
}: LeadsTableProps) {
    const { isMobile } = useResponsive();
    const selectable = !!(isSelected && onToggleSelect);
    const allChecked = selectable && leads.length > 0 && leads.every((lead) => isSelected(lead.id));

    if (isMobile) {
        return (
            <div className="space-y-3">
                {selectable && leads.length > 0 && (
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                        <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                            <input
                                type="checkbox"
                                checked={allChecked}
                                onChange={() => (allChecked ? onClearAll?.() : onSelectAll?.())}
                                className="h-4 w-4 rounded border-slate-300"
                            />
                            Select all
                        </label>
                        <span className="text-xs font-medium text-slate-500">{leads.length} leads</span>
                    </div>
                )}

                {leads.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500 shadow-sm">
                        No leads match the current filters.
                    </div>
                ) : (
                    leads.map((lead) => (
                        <article
                            key={lead.id}
                            className={`rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition active:scale-[0.99] ${
                                selectable && isSelected(lead.id) ? 'border-indigo-300 bg-indigo-50/40' : ''
                            }`}
                            onClick={() => onViewLead(lead)}
                        >
                            <div className="flex items-start gap-3">
                                {selectable && (
                                    <div className="pt-1" onClick={(event) => event.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={isSelected(lead.id)}
                                            onChange={() => onToggleSelect(lead.id)}
                                            className="h-4 w-4 rounded border-slate-300"
                                        />
                                    </div>
                                )}

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h3 className="truncate text-sm font-semibold text-slate-900">{lead.name}</h3>
                                            <p className="mt-1 truncate text-xs text-slate-500">{lead.email}</p>
                                        </div>
                                        <StatusBadge status={lead.status} />
                                    </div>

                                    <div className="mt-4 grid gap-2 text-xs text-slate-600">
                                        <p className="flex items-center gap-2">
                                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                                            <span className="truncate">{lead.phone}</span>
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <UserRound className="h-3.5 w-3.5 text-slate-400" />
                                            <span className="truncate">{lead.assignedTo}</span>
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                                            <span>Last contact {formatDate(lead.lastContact)}</span>
                                        </p>
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                                            {lead.source}
                                        </span>
                                        {lead.tags.slice(0, 2).map((tag) => (
                                            <span
                                                key={tag}
                                                className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-700"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                        {lead.tags.length > 2 && (
                                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                                                +{lead.tags.length - 2}
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-4 flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                onViewLead(lead);
                                            }}
                                            className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                        >
                                            <Eye className="h-4 w-4" />
                                            View
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                onEditLead(lead);
                                            }}
                                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                onWhatsAppLead(lead);
                                            }}
                                            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-green-700 transition hover:bg-green-100"
                                            aria-label={`Open WhatsApp for ${lead.name}`}
                                        >
                                            <MessageCircle className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </article>
                    ))
                )}
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-slate-50">
                        <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {selectable && (
                                <th className="w-10 px-4 py-3">
                                    <input
                                        type="checkbox"
                                        checked={allChecked}
                                        onChange={() => (allChecked ? onClearAll?.() : onSelectAll?.())}
                                        className="rounded border-slate-300"
                                    />
                                </th>
                            )}
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Phone</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Source</th>
                            <th className="px-4 py-3">Assigned To</th>
                            <th className="px-4 py-3">Last Contact</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {leads.length === 0 ? (
                            <tr>
                                <td colSpan={selectable ? 8 : 7} className="px-4 py-8 text-center text-slate-500">
                                    No leads match the current filters.
                                </td>
                            </tr>
                        ) : (
                            leads.map((lead) => (
                                <tr
                                    key={lead.id}
                                    className={`cursor-pointer transition hover:bg-slate-50 ${
                                        selectable && isSelected(lead.id) ? 'bg-indigo-50' : ''
                                    }`}
                                    onClick={() => onViewLead(lead)}
                                >
                                    {selectable && (
                                        <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={isSelected(lead.id)}
                                                onChange={() => onToggleSelect(lead.id)}
                                                className="rounded border-slate-300"
                                            />
                                        </td>
                                    )}
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-slate-900">{lead.name}</div>
                                        <div className="text-xs text-slate-500">{lead.email}</div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">{lead.phone}</td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={lead.status} />
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">{lead.source}</td>
                                    <td className="px-4 py-3 text-slate-700">{lead.assignedTo}</td>
                                    <td className="px-4 py-3 text-slate-700">{formatDate(lead.lastContact)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    onViewLead(lead);
                                                }}
                                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-white"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                                View
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    onEditLead(lead);
                                                }}
                                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-white"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    onWhatsAppLead(lead);
                                                }}
                                                className="inline-flex items-center rounded-lg border border-green-200 bg-green-50 p-1.5 text-green-700 transition hover:bg-green-100"
                                                aria-label="Open WhatsApp"
                                            >
                                                <MessageCircle className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
