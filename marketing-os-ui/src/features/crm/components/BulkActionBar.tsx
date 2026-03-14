import React from 'react';
import { Trash2, UserCheck, ArrowRightCircle, X } from 'lucide-react';
import type { LeadStatus } from '../data/leads';
import { LEAD_STATUS_ORDER } from '../data/leads';

const AGENTS = ['Riya Sharma', 'Kabir Anand', 'Arjun Das', 'Meera Joshi'];

interface Props {
    count: number;
    onClear: () => void;
    onBulkStatusChange: (status: LeadStatus) => void;
    onBulkAssign: (agent: string) => void;
    onBulkDelete: () => void;
}

export const BulkActionBar: React.FC<Props> = ({
    count,
    onClear,
    onBulkStatusChange,
    onBulkAssign,
    onBulkDelete,
}) => {
    const [showStatus, setShowStatus] = React.useState(false);
    const [showAssign, setShowAssign] = React.useState(false);

    if (count === 0) return null;

    return (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-3 py-3 text-sm shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-indigo-700">{count} selected</span>
                <button
                    type="button"
                    className="rounded-full p-1 text-slate-400 transition hover:bg-white hover:text-slate-700"
                    onClick={onClear}
                    aria-label="Clear selection"
                >
                    <X size={16} />
                </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
                <div className="relative">
                    <button
                        type="button"
                        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-indigo-200 bg-white px-3 py-2 font-medium text-indigo-700 transition hover:bg-indigo-100"
                        onClick={() => { setShowStatus(!showStatus); setShowAssign(false); }}
                    >
                        <ArrowRightCircle size={14} /> Move to
                    </button>
                    {showStatus && (
                        <ul className="absolute left-0 top-full z-10 mt-2 w-40 rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                            {LEAD_STATUS_ORDER.map((s) => (
                                <li key={s}>
                                    <button
                                        type="button"
                                        className="w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-indigo-50"
                                        onClick={() => { onBulkStatusChange(s); setShowStatus(false); }}
                                    >
                                        {s}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="relative">
                    <button
                        type="button"
                        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-indigo-200 bg-white px-3 py-2 font-medium text-indigo-700 transition hover:bg-indigo-100"
                        onClick={() => { setShowAssign(!showAssign); setShowStatus(false); }}
                    >
                        <UserCheck size={14} /> Assign
                    </button>
                    {showAssign && (
                        <ul className="absolute left-0 top-full z-10 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                            {AGENTS.map((a) => (
                                <li key={a}>
                                    <button
                                        type="button"
                                        className="w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-indigo-50"
                                        onClick={() => { onBulkAssign(a); setShowAssign(false); }}
                                    >
                                        {a}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <button
                    type="button"
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 font-medium text-red-600 transition hover:bg-red-100"
                    onClick={onBulkDelete}
                >
                    <Trash2 size={14} /> Delete
                </button>
            </div>
        </div>
    );
};
