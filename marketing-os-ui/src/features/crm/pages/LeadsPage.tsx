import { startTransition, useMemo, useState } from 'react';
import {
    DragKanbanBoard,
    LeadDrawer,
    LeadsTable,
    SearchBar,
    StatsBar,
    SourceChart,
    StatusChart,
    AddLeadModal,
    BulkActionBar,
    DealsPipeline,
    TaskManager,
    ConversionFunnel,
    AgentPerformance,
    DealValueChart,
    TasksOverviewChart,
    TopTagsChart,
} from '../components';
import { DEFAULT_LEAD_NOTES } from '../data/leads';
import type { LeadRecord, LeadStatus } from '../data/leads';
import {
    useLeadFilters,
    useLeadNotes,
    useLeadStats,
    useLeadStore,
    useLeadActivities,
    useBulkSelection,
    useDeals,
    useTasks,
} from '../hooks';

type CrmTab = 'leads' | 'deals' | 'tasks' | 'analytics';
type LeadsViewMode = 'list' | 'kanban';

const tabClass = (active: boolean) =>
    `inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
        active ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

const viewButtonClass = (active: boolean) =>
    `inline-flex w-full items-center justify-center rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        active ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

export function LeadsPage() {
    const [activeTab, setActiveTab] = useState<CrmTab>('leads');
    const [viewMode, setViewMode] = useState<LeadsViewMode>('list');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);
    const [addModalOpen, setAddModalOpen] = useState(false);

    const { leads, addLead, updateLeadStatus, bulkUpdateStatus, bulkDelete, bulkAssign } = useLeadStore();
    const { searchTerm, setSearchTerm, statusFilter, setStatusFilter, filteredLeads } = useLeadFilters(leads);

    const leadIds = useMemo(() => leads.map((lead) => lead.id), [leads]);
    const { addLeadNote, getLeadNotes } = useLeadNotes(leadIds, DEFAULT_LEAD_NOTES);

    const stats = useLeadStats(leads);
    const leadActivities = useLeadActivities(selectedLead?.id ?? null);
    const { selected, toggle, selectAll, clearAll, isSelected, count: bulkCount } = useBulkSelection();
    const { deals: allDeals, byStage, totals, weighted, moveDeal, stages } = useDeals();

    const {
        tasks: allTasks,
        byStatus: tasksByStatus,
        changeStatus: changeTaskStatus,
        deleteTask,
        filterStatus: taskFilterStatus,
        setFilterStatus: setTaskFilterStatus,
        filterPriority: taskFilterPriority,
        setFilterPriority: setTaskFilterPriority,
    } = useTasks();

    const openLeadDrawer = (lead: LeadRecord) => {
        setSelectedLead(lead);
        setDrawerOpen(true);
    };

    const handleAddNote = (note: string) => {
        if (!selectedLead) return;
        addLeadNote(selectedLead.id, note);
    };

    const handleBulkStatusChange = (status: LeadStatus) => {
        bulkUpdateStatus(Array.from(selected), status);
        clearAll();
    };

    const handleBulkAssign = (agent: string) => {
        bulkAssign(Array.from(selected), agent);
        clearAll();
    };

    const handleBulkDelete = () => {
        bulkDelete(Array.from(selected));
        clearAll();
    };

    const selectedLeadNotes = selectedLead ? getLeadNotes(selectedLead.id) : DEFAULT_LEAD_NOTES;
    const changeTab = (tab: CrmTab) => startTransition(() => setActiveTab(tab));
    const changeViewMode = (mode: LeadsViewMode) => startTransition(() => setViewMode(mode));

    return (
        <section className="min-h-full rounded-[28px] bg-gradient-to-b from-slate-100 via-slate-50 to-white p-3 sm:p-6">
            <div className="space-y-4">
                <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">CRM</h1>
                        <p className="max-w-xl text-sm text-slate-500">
                            Leads, deals, and tasks in one mobile-first sales workspace.
                        </p>
                    </div>

                    <div className="grid w-full grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm sm:inline-flex sm:w-auto sm:grid-cols-none">
                        <button type="button" onClick={() => changeTab('leads')} className={tabClass(activeTab === 'leads')}>
                            Leads
                        </button>
                        <button type="button" onClick={() => changeTab('deals')} className={tabClass(activeTab === 'deals')}>
                            Deals
                        </button>
                        <button type="button" onClick={() => changeTab('tasks')} className={tabClass(activeTab === 'tasks')}>
                            Tasks
                        </button>
                        <button
                            type="button"
                            onClick={() => changeTab('analytics')}
                            className={tabClass(activeTab === 'analytics')}
                        >
                            Analytics
                        </button>
                    </div>
                </header>

                {activeTab === 'leads' && (
                    <>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="grid w-full grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm sm:inline-flex sm:w-auto sm:grid-cols-none">
                                <button
                                    type="button"
                                    onClick={() => changeViewMode('list')}
                                    className={viewButtonClass(viewMode === 'list')}
                                >
                                    List
                                </button>
                                <button
                                    type="button"
                                    onClick={() => changeViewMode('kanban')}
                                    className={viewButtonClass(viewMode === 'kanban')}
                                >
                                    Kanban
                                </button>
                            </div>

                            <button
                                type="button"
                                className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 sm:w-auto"
                                onClick={() => setAddModalOpen(true)}
                            >
                                + New Lead
                            </button>
                        </div>

                        <BulkActionBar
                            count={bulkCount}
                            onClear={clearAll}
                            onBulkStatusChange={handleBulkStatusChange}
                            onBulkAssign={handleBulkAssign}
                            onBulkDelete={handleBulkDelete}
                        />

                        {viewMode === 'list' ? (
                            <>
                                <SearchBar
                                    searchTerm={searchTerm}
                                    onSearchTermChange={setSearchTerm}
                                    statusFilter={statusFilter}
                                    onStatusFilterChange={setStatusFilter}
                                />
                                <LeadsTable
                                    leads={filteredLeads}
                                    onViewLead={openLeadDrawer}
                                    onEditLead={openLeadDrawer}
                                    onWhatsAppLead={openLeadDrawer}
                                    isSelected={isSelected}
                                    onToggleSelect={toggle}
                                    onSelectAll={() => selectAll(filteredLeads.map((lead) => lead.id))}
                                    onClearAll={clearAll}
                                />
                            </>
                        ) : (
                            <DragKanbanBoard
                                leads={leads}
                                onOpenLead={openLeadDrawer}
                                onStatusChange={updateLeadStatus}
                            />
                        )}

                        <AddLeadModal open={addModalOpen} onClose={() => setAddModalOpen(false)} onSubmit={addLead} />
                    </>
                )}

                {activeTab === 'analytics' && (
                    <>
                        <StatsBar stats={stats} />

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <SourceChart stats={stats} />
                            <StatusChart stats={stats} />
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <ConversionFunnel stats={stats} />
                            <AgentPerformance leads={leads} />
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <DealValueChart deals={allDeals} />
                            <TasksOverviewChart tasks={allTasks} />
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <TopTagsChart leads={leads} />
                        </div>
                    </>
                )}

                {activeTab === 'deals' && (
                    <DealsPipeline
                        stages={stages}
                        byStage={byStage}
                        totals={totals}
                        weighted={weighted}
                        onMoveDeal={moveDeal}
                    />
                )}

                {activeTab === 'tasks' && (
                    <TaskManager
                        byStatus={tasksByStatus}
                        filterStatus={taskFilterStatus}
                        filterPriority={taskFilterPriority}
                        onFilterStatus={setTaskFilterStatus}
                        onFilterPriority={setTaskFilterPriority}
                        onChangeStatus={changeTaskStatus}
                        onDelete={deleteTask}
                    />
                )}
            </div>

            <LeadDrawer
                lead={selectedLead}
                open={drawerOpen}
                notes={selectedLeadNotes}
                activities={leadActivities}
                onClose={() => setDrawerOpen(false)}
                onAddNote={handleAddNote}
            />
        </section>
    );
}
