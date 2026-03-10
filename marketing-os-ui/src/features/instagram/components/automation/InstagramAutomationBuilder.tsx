import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useFieldArray, useForm, useWatch, type UseFormRegister } from 'react-hook-form';
import {
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  Home,
  ImageIcon,
  LayoutTemplate,
  LifeBuoy,
  Link2,
  MessageCircle,
  MessageSquareText,
  MousePointerClick,
  Package,
  Play,
  Plus,
  Save,
  Search,
  ShoppingBag,
  Trash2,
  Users,
  Workflow,
  X,
  type LucideIcon,
} from 'lucide-react';
import { CATALOG_PRODUCTS, COMMENT_EXAMPLES, INSTAGRAM_AUTOMATION_NAV, SUGGESTED_KEYWORDS } from './mockData';
import { useInstagramAutomationStore } from './useInstagramAutomationStore';
import type {
  AutomationBuilderFormValues,
  CatalogProduct,
  InstagramAutomationSchema,
  MessageBlock,
  MessageBlockType,
  PreviewTab,
} from './types';

const MAX_KEYWORDS = 20;

const NAV_ICON: Record<(typeof INSTAGRAM_AUTOMATION_NAV)[number]['id'], LucideIcon> = {
  home: Home,
  automations: Workflow,
  templates: LayoutTemplate,
  content: FolderOpen,
  contacts: Users,
  analytics: BarChart3,
  support: LifeBuoy,
};

const BLOCK_META: Record<MessageBlockType, { label: string; icon: LucideIcon }> = {
  text: { label: 'Text message', icon: MessageSquareText },
  button: { label: 'Button', icon: Link2 },
  product_card: { label: 'Product card', icon: Package },
  product_catalog: { label: 'Product catalog', icon: ShoppingBag },
  image: { label: 'Image', icon: ImageIcon },
  cta: { label: 'CTA button', icon: MousePointerClick },
};

const createId = (prefix: string): string => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const defaults: AutomationBuilderFormValues = {
  id: createId('ig-auto'),
  name: 'Instagram Comment to DM Automation',
  status: 'draft',
  trigger: {
    type: 'comment',
    scope: 'specific',
    postId: 'post_2026_spring-drop',
    keywordFilterEnabled: true,
    keywords: [{ value: 'link' }],
  },
  optionalActions: {
    replyPublic: true,
    sendOpeningDm: true,
    requireFollow: false,
    collectEmail: false,
  },
  actions: [
    {
      type: 'send_dm',
      message: "Hey! Here's the link you requested.",
      products: CATALOG_PRODUCTS.slice(0, 3),
      blocks: [
        { id: createId('b-text'), type: 'text', text: "Hey! Here's the link you requested." },
        { id: createId('b-btn'), type: 'button', label: 'Shop the look', url: 'https://example.com/shop' },
        { id: createId('b-cat'), type: 'product_catalog', text: 'Recommended products' },
      ],
    },
  ],
};

const scopes = [
  { value: 'specific' as const, label: 'Specific post or reel' },
  { value: 'next' as const, label: 'Next post or reel' },
  { value: 'any' as const, label: 'Any post or reel' },
];

const optionalToggles = [
  { name: 'optionalActions.replyPublic' as const, label: 'Reply publicly to comment before sending DM' },
  { name: 'optionalActions.sendOpeningDm' as const, label: 'Send opening DM message' },
  { name: 'optionalActions.requireFollow' as const, label: 'Ask user to follow before receiving link' },
  { name: 'optionalActions.collectEmail' as const, label: 'Ask user for email to collect leads' },
];

const previewTabs: Array<{ id: PreviewTab; label: string }> = [
  { id: 'post', label: 'Post' },
  { id: 'comments', label: 'Comments' },
  { id: 'dm', label: 'DM' },
];

const toSchema = (values: AutomationBuilderFormValues): InstagramAutomationSchema => ({
  id: values.id,
  name: values.name,
  trigger: {
    type: 'comment',
    postId: values.trigger.scope === 'specific' ? values.trigger.postId || undefined : undefined,
    keywords: values.trigger.keywords.map((item) => item.value).filter(Boolean),
    scope: values.trigger.scope,
  },
  actions: [
    {
      ...values.actions[0],
      buttons: values.actions[0].blocks
        .filter((block) => block.type === 'button' || block.type === 'cta')
        .map((block) => ({ label: block.label || block.ctaLabel || 'Open', url: block.url || 'https://example.com' })),
    },
  ],
  status: values.status,
});

const blockFromType = (type: MessageBlockType): MessageBlock => {
  if (type === 'text') return { id: createId('text'), type, text: 'Type your message...' };
  if (type === 'button') return { id: createId('btn'), type, label: 'Button label', url: 'https://example.com' };
  if (type === 'product_card') return { id: createId('pc'), type, productId: CATALOG_PRODUCTS[0]?.id, ctaLabel: 'Buy now' };
  if (type === 'product_catalog') return { id: createId('pg'), type, text: 'Featured products' };
  if (type === 'image') return { id: createId('img'), type, imageUrl: CATALOG_PRODUCTS[0]?.image };
  return { id: createId('cta'), type, ctaLabel: 'Get Offer', url: 'https://example.com/offer' };
};

const InstagramAutomationBuilder: React.FC = () => {
  const [keywordInput, setKeywordInput] = useState('');
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalogIds, setCatalogIds] = useState<string[]>([]);
  const [savedAt, setSavedAt] = useState('');

  const activePreviewTab = useInstagramAutomationStore((state) => state.activePreviewTab);
  const selectedNav = useInstagramAutomationStore((state) => state.selectedNav);
  const simulationStep = useInstagramAutomationStore((state) => state.simulationStep);
  const flowNodes = useInstagramAutomationStore((state) => state.flowNodes);
  const flowEdges = useInstagramAutomationStore((state) => state.flowEdges);
  const setActivePreviewTab = useInstagramAutomationStore((state) => state.setActivePreviewTab);
  const setSelectedNav = useInstagramAutomationStore((state) => state.setSelectedNav);
  const setSimulationStep = useInstagramAutomationStore((state) => state.setSimulationStep);
  const cycleSimulationStep = useInstagramAutomationStore((state) => state.cycleSimulationStep);
  const setFlowNodes = useInstagramAutomationStore((state) => state.setFlowNodes);
  const setFlowEdges = useInstagramAutomationStore((state) => state.setFlowEdges);

  const { control, register, setValue, getValues } = useForm<AutomationBuilderFormValues>({ defaultValues: defaults });
  const { fields: keywordFields, append: appendKeyword, remove: removeKeyword } = useFieldArray({ control, name: 'trigger.keywords' });
  const { fields: blockFields, append: appendBlock, remove: removeBlock, move } = useFieldArray({
    control,
    name: 'actions.0.blocks',
    keyName: 'fieldKey',
  });

  const values = useWatch({ control });
  const keywords = useWatch({ control, name: 'trigger.keywords' });
  const blocks = useWatch({ control, name: 'actions.0.blocks' });
  const products = useWatch({ control, name: 'actions.0.products' });
  const optional = useWatch({ control, name: 'optionalActions' });
  const scope = useWatch({ control, name: 'trigger.scope' });
  const keywordFilter = useWatch({ control, name: 'trigger.keywordFilterEnabled' });
  const message = useWatch({ control, name: 'actions.0.message' });

  const schema = useMemo(() => toSchema(values as AutomationBuilderFormValues), [values]);

  useEffect(() => {
    const timer = window.setInterval(() => cycleSimulationStep(), 3500);
    return () => window.clearInterval(timer);
  }, [cycleSimulationStep]);

  useEffect(() => {
    if (simulationStep === 1) setActivePreviewTab('post');
    if (simulationStep === 2) setActivePreviewTab('comments');
    if (simulationStep >= 3) setActivePreviewTab('dm');
  }, [simulationStep, setActivePreviewTab]);

  const addKeyword = (raw: string) => {
    const value = raw.trim().toLowerCase();
    if (!value || keywordFields.length >= MAX_KEYWORDS || keywords.some((item) => item.value.toLowerCase() === value)) return;
    appendKeyword({ value });
    setKeywordInput('');
  };

  const save = (status: 'draft' | 'active') => {
    setValue('status', status, { shouldDirty: true });
    const payload = toSchema({ ...getValues(), status });
    console.log('Instagram automation payload', payload);
    setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  const openCatalog = () => {
    setCatalogIds(products.map((item) => item.id));
    setCatalogOpen(true);
  };

  const applyCatalog = () => {
    setValue(
      'actions.0.products',
      CATALOG_PRODUCTS.filter((item) => catalogIds.includes(item.id)),
      { shouldDirty: true },
    );
    setCatalogOpen(false);
  };

  const onNodesChange = (changes: NodeChange[]) => setFlowNodes(applyNodeChanges(changes, flowNodes));
  const onEdgesChange = (changes: EdgeChange[]) => setFlowEdges(applyEdgeChanges(changes, flowEdges));
  const onConnect = (connection: Connection) => setFlowEdges(addEdge({ ...connection, animated: true }, flowEdges));

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05070d] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(56,189,248,0.16),transparent_36%),radial-gradient(circle_at_90%_8%,rgba(129,140,248,0.16),transparent_40%)]" />
      <div className="relative border-b border-white/10 px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">Instagram Automation Builder</p>
            <h2 className="mt-1 text-xl font-semibold sm:text-2xl">{values.name}</h2>
            <p className="mt-1 text-sm text-slate-400">Comment trigger to DM automation with product catalog support.</p>
          </div>
          <div className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-slate-300">{savedAt ? `Last saved ${savedAt}` : 'Unsaved changes'}</div>
        </div>
      </div>
      <div className="relative grid min-h-[calc(100vh-88px)] grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)_400px]">
        <aside className="border-b border-white/10 bg-[#070b16] px-4 py-5 xl:border-b-0 xl:border-r xl:border-white/10">
          <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-lime-300/60 bg-lime-300 px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-lime-200"><Plus className="h-4 w-4" />New Automation</button>
          <div className="mt-6 space-y-1">
            {INSTAGRAM_AUTOMATION_NAV.map((item) => {
              const Icon = NAV_ICON[item.id];
              const active = selectedNav === item.id;
              return (
                <button key={item.id} onClick={() => setSelectedNav(item.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm ${active ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}>
                  <Icon className={`h-4 w-4 ${active ? 'text-sky-300' : 'text-slate-500'}`} /> {item.label}
                </button>
              );
            })}
          </div>
        </aside>
        <main className="order-3 border-t border-white/10 bg-[#090e1a] px-4 py-5 xl:order-2 xl:border-t-0 xl:px-6">
          <PhonePreview activePreviewTab={activePreviewTab} setActivePreviewTab={setActivePreviewTab} keywords={keywords.map((item) => item.value)} blocks={blocks} products={products} optional={optional} message={message} simulationStep={simulationStep} />
        </main>
        <aside className="order-2 border-t border-white/10 bg-[#060914] px-4 py-5 xl:order-3 xl:border-l xl:border-t-0 xl:border-white/10">
          <div className="mb-4 flex items-center gap-2">
            <button onClick={() => save('draft')} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm hover:bg-white/10"><Save className="h-4 w-4" />Save Draft</button>
            <button onClick={() => save('active')} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-lime-300/60 bg-lime-300 px-3 py-2.5 text-sm font-semibold text-slate-900 hover:bg-lime-200"><Play className="h-4 w-4" />Start</button>
          </div>
          <div className="space-y-4 xl:max-h-[calc(100vh-290px)] xl:overflow-y-auto xl:pr-1">
            <Section step={1} title="When a user comments on">
              {scopes.map((item) => {
                const active = item.value === scope;
                return (
                  <div key={item.value} className={`rounded-xl border p-3 ${active ? 'border-sky-300/40 bg-sky-400/10' : 'border-white/10 bg-white/[0.02]'}`}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">{item.label}</p>
                      <Toggle checked={active} onChange={(checked) => checked && setValue('trigger.scope', item.value)} />
                    </div>
                    {item.value === 'specific' && active ? <input {...register('trigger.postId')} className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 text-sm outline-none focus:border-sky-300/60" placeholder="Specific post/reel ID" /> : null}
                  </div>
                );
              })}
            </Section>
            <Section step={2} title="And his/her comment has" done={keywordFilter}>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <div className="flex items-center justify-between"><p className="text-sm font-medium">Specific keyword</p><Controller control={control} name="trigger.keywordFilterEnabled" render={({ field }) => <Toggle checked={field.value} onChange={field.onChange} />} /></div>
                <div className="mt-3 flex gap-2">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input value={keywordInput} onChange={(event) => setKeywordInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addKeyword(keywordInput); } }} className="h-10 w-full rounded-lg border border-white/10 bg-slate-900/80 pl-9 pr-3 text-sm outline-none focus:border-sky-300/60" placeholder="Add keyword" />
                  </div>
                  <button onClick={() => addKeyword(keywordInput)} className="rounded-lg border border-white/10 bg-white/5 px-3 text-sm hover:bg-white/10">Add</button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {keywordFields.map((field, index) => (
                    <span key={field.id} className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs">{keywords[index]?.value || field.value}<button onClick={() => removeKeyword(index)} className="rounded p-0.5 hover:bg-white/10"><X className="h-3 w-3" /></button></span>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">{SUGGESTED_KEYWORDS.map((item) => <button key={item} onClick={() => addKeyword(item)} className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs hover:border-white/30">{item}</button>)}</div>
                <p className="mt-2 text-right text-xs text-slate-500">{keywordFields.length}/{MAX_KEYWORDS} keywords</p>
              </div>
            </Section>
            <Section step={3} title="They will optionally get">
              <div className="space-y-2">
                {optionalToggles.map((item) => (
                  <div key={item.name} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">{item.label}</p>
                      <Controller control={control} name={item.name} render={({ field }) => <Toggle checked={field.value} onChange={field.onChange} />} />
                    </div>
                  </div>
                ))}
              </div>
            </Section>
            <Section step={4} title="And they will get a DM with" done>
              <div className="space-y-3">
                <textarea {...register('actions.0.message')} rows={3} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm outline-none focus:border-sky-300/60" placeholder="Opening DM message" />
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold">Message Builder</p>
                    <button onClick={openCatalog} className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs hover:bg-white/10"><ShoppingBag className="h-3.5 w-3.5" />Catalog Picker</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(BLOCK_META) as MessageBlockType[]).map((type) => {
                      const Icon = BLOCK_META[type].icon;
                      return (
                        <button key={type} onClick={() => appendBlock(blockFromType(type))} className="inline-flex items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-xs hover:border-sky-300/40">
                          <Icon className="h-3.5 w-3.5" />{BLOCK_META[type].label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 space-y-2">
                    {blockFields.map((field, index) => {
                      const block = blocks[index];
                      if (!block) return null;
                      const Icon = BLOCK_META[block.type].icon;
                      return (
                        <div key={field.fieldKey} className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <div className="inline-flex items-center gap-2 text-sm"><Icon className="h-4 w-4 text-sky-300" />{BLOCK_META[block.type].label}</div>
                            <div className="inline-flex gap-1">
                              <button disabled={index === 0} onClick={() => move(index, index - 1)} className="rounded border border-white/10 p-1 disabled:opacity-40"><ChevronUp className="h-3.5 w-3.5" /></button>
                              <button disabled={index === blockFields.length - 1} onClick={() => move(index, index + 1)} className="rounded border border-white/10 p-1 disabled:opacity-40"><ChevronDown className="h-3.5 w-3.5" /></button>
                              <button onClick={() => removeBlock(index)} className="rounded border border-rose-300/25 p-1 text-rose-200"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                          </div>
                          <BlockEditor block={block} index={index} register={register} products={products.length ? products : CATALOG_PRODUCTS} openCatalog={openCatalog} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Section>
            <details className="rounded-xl border border-white/10 bg-black/25 p-3 text-xs">
              <summary className="cursor-pointer font-medium">Automation schema preview</summary>
              <pre className="mt-3 max-h-64 overflow-auto rounded-lg border border-white/10 bg-slate-950/90 p-3 text-[11px] text-slate-300">{JSON.stringify(schema, null, 2)}</pre>
            </details>
          </div>
        </aside>
      </div>
      {catalogOpen ? (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#080d1b] p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Catalog Picker</p>
                <h4 className="text-lg font-semibold">Select products</h4>
              </div>
              <button onClick={() => setCatalogOpen(false)} className="rounded-lg border border-white/10 p-2"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid max-h-[420px] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
              {CATALOG_PRODUCTS.map((item) => {
                const selected = catalogIds.includes(item.id);
                return (
                  <button key={item.id} onClick={() => setCatalogIds((previous) => (previous.includes(item.id) ? previous.filter((id) => id !== item.id) : [...previous, item.id]))} className={`rounded-xl border p-2 text-left ${selected ? 'border-lime-300/50 bg-lime-300/10' : 'border-white/10 bg-white/[0.03]'}`}>
                    <img src={item.image} alt={item.name} className="h-28 w-full rounded-lg object-cover" />
                    <div className="mt-2 flex items-start justify-between gap-2"><div><p className="text-sm font-medium">{item.name}</p><p className="text-xs text-slate-400">{item.description}</p></div><span className="text-sm font-semibold text-lime-300">INR {item.price}</span></div>
                    <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-1 text-[11px]">{selected ? <Check className="h-3.5 w-3.5 text-lime-300" /> : null}{selected ? 'Selected' : item.ctaLabel}</div>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-sm text-slate-300">{catalogIds.length} selected</p>
              <div className="inline-flex gap-2">
                <button onClick={() => setCatalogOpen(false)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">Cancel</button>
                <button onClick={applyCatalog} className="rounded-lg border border-lime-300/60 bg-lime-300 px-3 py-2 text-sm font-semibold text-slate-900">Apply Selection</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const Section: React.FC<{ step: number; title: string; children: React.ReactNode; done?: boolean }> = ({ step, title, children, done = false }) => (
  <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
    <div className="mb-3 flex items-center gap-2">
      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${done ? 'bg-lime-300 text-slate-900' : 'bg-slate-800 text-slate-200'}`}>{done ? <Check className="h-3.5 w-3.5" /> : step}</span>
      <h4 className="text-base font-semibold">{title}</h4>
    </div>
    {children}
  </section>
);

const Toggle: React.FC<{ checked: boolean; onChange: (value: boolean) => void }> = ({ checked, onChange }) => (
  <button onClick={() => onChange(!checked)} className={`relative inline-flex h-7 w-12 items-center rounded-full border ${checked ? 'border-sky-300/70 bg-sky-300/30' : 'border-white/15 bg-slate-800/90'}`}>
    <span className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

const BlockEditor: React.FC<{
  block: MessageBlock;
  index: number;
  register: UseFormRegister<AutomationBuilderFormValues>;
  products: CatalogProduct[];
  openCatalog: () => void;
}> = ({ block, index, register, products, openCatalog }) => {
  if (block.type === 'text') return <textarea {...register(`actions.0.blocks.${index}.text` as const)} rows={2} className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-sm outline-none focus:border-sky-300/60" />;
  if (block.type === 'button') return <div className="grid grid-cols-1 gap-2 sm:grid-cols-2"><input {...register(`actions.0.blocks.${index}.label` as const)} className="h-10 rounded-lg border border-white/10 bg-slate-900/80 px-3 text-sm outline-none focus:border-sky-300/60" placeholder="Button label" /><input {...register(`actions.0.blocks.${index}.url` as const)} className="h-10 rounded-lg border border-white/10 bg-slate-900/80 px-3 text-sm outline-none focus:border-sky-300/60" placeholder="https://example.com" /></div>;
  if (block.type === 'cta') return <div className="grid grid-cols-1 gap-2 sm:grid-cols-2"><input {...register(`actions.0.blocks.${index}.ctaLabel` as const)} className="h-10 rounded-lg border border-white/10 bg-slate-900/80 px-3 text-sm outline-none focus:border-sky-300/60" placeholder="CTA label" /><input {...register(`actions.0.blocks.${index}.url` as const)} className="h-10 rounded-lg border border-white/10 bg-slate-900/80 px-3 text-sm outline-none focus:border-sky-300/60" placeholder="https://example.com/offer" /></div>;
  if (block.type === 'image') return <div className="space-y-2"><input {...register(`actions.0.blocks.${index}.imageUrl` as const)} className="h-10 w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 text-sm outline-none focus:border-sky-300/60" placeholder="Image URL" />{block.imageUrl ? <img src={block.imageUrl} alt="Preview" className="h-24 w-full rounded-lg border border-white/10 object-cover" /> : null}</div>;
  if (block.type === 'product_card') return <div className="space-y-2"><select {...register(`actions.0.blocks.${index}.productId` as const)} className="h-10 w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 text-sm outline-none focus:border-sky-300/60">{products.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><input {...register(`actions.0.blocks.${index}.ctaLabel` as const)} className="h-10 w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 text-sm outline-none focus:border-sky-300/60" placeholder="CTA label" /></div>;
  return <button onClick={openCatalog} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10">Open catalog picker</button>;
};

const PhonePreview: React.FC<{
  activePreviewTab: PreviewTab;
  setActivePreviewTab: (tab: PreviewTab) => void;
  keywords: string[];
  blocks: MessageBlock[];
  products: CatalogProduct[];
  optional: AutomationBuilderFormValues['optionalActions'];
  message: string;
  simulationStep: number;
}> = ({ activePreviewTab, setActivePreviewTab, keywords, blocks, products, optional, message, simulationStep }) => {
  const keyword = keywords[0] || 'link';
  const resolveProduct = (id?: string): CatalogProduct => products.find((item) => item.id === id) || CATALOG_PRODUCTS.find((item) => item.id === id) || products[0] || CATALOG_PRODUCTS[0];
  return (
    <div className="mx-auto flex max-w-[430px] flex-col items-center">
      <div className="w-full rounded-[42px] border-4 border-indigo-950/80 bg-black p-2">
        <div className="relative h-[640px] overflow-hidden rounded-[36px] border border-indigo-500/20 bg-black">
          <div className="absolute left-1/2 top-2 h-6 w-36 -translate-x-1/2 rounded-full bg-slate-900/90" />
          <div className="flex h-14 items-end justify-between border-b border-white/10 px-4 pb-2 text-xs text-slate-300"><div className="inline-flex items-center gap-2"><button className="rounded-full bg-white/10 p-1"><ArrowRight className="h-3.5 w-3.5 rotate-180" /></button><div><p className="text-sm font-semibold text-white">wayout_in</p><p className="text-[10px] text-slate-400">Business</p></div></div><div className="inline-flex items-center gap-3"><MessageCircle className="h-4 w-4" /><Bot className="h-4 w-4" /></div></div>
          {activePreviewTab === 'post' ? <div className="flex h-[calc(100%-56px)] flex-col"><img src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80" alt="Post" className="h-[52%] w-full object-cover" /><div className="space-y-3 p-4 text-sm"><p>Comment <span className="rounded bg-sky-400/20 px-1.5 py-0.5 text-sky-200">"{keyword}"</span> and we will DM the catalog.</p><div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-xs">User comment preview: "link pls"</div></div></div> : null}
          {activePreviewTab === 'comments' ? <div className="h-[calc(100%-56px)] space-y-3 overflow-y-auto p-4">{COMMENT_EXAMPLES.map((item) => { const hit = item.text.toLowerCase().includes(keyword.toLowerCase()); return <div key={item.id} className={`rounded-2xl border p-3 ${hit ? 'border-sky-300/40 bg-sky-400/10' : 'border-white/10 bg-white/[0.02]'}`}><div className="flex items-center justify-between text-xs text-slate-400"><span>{item.user}</span><span>{item.time}</span></div><p className="mt-1 text-sm">{item.text}</p>{hit ? <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-lime-300/20 px-2 py-1 text-[11px] text-lime-200"><Check className="h-3 w-3" />Keyword detected</p> : null}</div>; })}</div> : null}
          {activePreviewTab === 'dm' ? <div className="flex h-[calc(100%-56px)] flex-col"><div className="flex-1 space-y-3 overflow-y-auto p-4"><div className="ml-auto max-w-[86%] rounded-2xl bg-blue-600 px-3 py-2 text-sm text-white">Commented "{keyword}" on your post</div>{optional.sendOpeningDm ? <div className="max-w-[86%] rounded-2xl bg-slate-900 px-3 py-2 text-sm">Hi! Let me send the details.</div> : null}<div className="max-w-[86%] rounded-2xl bg-slate-900 px-3 py-2 text-sm">{message}</div>{blocks.map((block) => { if (block.type === 'text') return <div key={block.id} className="max-w-[86%] rounded-2xl bg-slate-900 px-3 py-2 text-sm">{block.text}</div>; if (block.type === 'button') return <button key={block.id} className="inline-flex max-w-[86%] items-center gap-2 rounded-xl border border-sky-300/40 bg-sky-400/15 px-3 py-2 text-sm text-sky-100"><Link2 className="h-4 w-4" />{block.label || 'Open'}</button>; if (block.type === 'cta') return <button key={block.id} className="inline-flex max-w-[86%] items-center gap-2 rounded-xl border border-lime-300/40 bg-lime-300/20 px-3 py-2 text-sm text-lime-100"><MousePointerClick className="h-4 w-4" />{block.ctaLabel || 'CTA'}</button>; if (block.type === 'image') return <img key={block.id} src={block.imageUrl} alt="DM visual" className="h-32 w-[86%] rounded-xl border border-white/10 object-cover" />; if (block.type === 'product_card') { const product = resolveProduct(block.productId); return <div key={block.id} className="w-[86%] rounded-2xl border border-white/10 bg-slate-900 p-2.5"><img src={product.image} alt={product.name} className="h-24 w-full rounded-xl object-cover" /><p className="mt-2 text-sm font-medium">{product.name}</p><p className="text-sm text-lime-300">INR {product.price}</p><button className="mt-2 w-full rounded-lg border border-lime-300/40 bg-lime-300/20 py-1.5 text-xs">{block.ctaLabel || product.ctaLabel}</button></div>; } const list = products.length ? products : CATALOG_PRODUCTS.slice(0, 3); return <div key={block.id} className="w-full max-w-[96%]"><p className="mb-2 text-xs text-slate-400">{block.text || 'Featured catalog'}</p><div className="flex gap-2 overflow-x-auto pb-1">{list.map((product) => <div key={product.id} className="min-w-[130px] rounded-xl border border-white/10 bg-slate-900 p-2"><img src={product.image} alt={product.name} className="h-20 w-full rounded-lg object-cover" /><p className="mt-1 line-clamp-1 text-xs">{product.name}</p><p className="text-xs text-lime-300">INR {product.price}</p></div>)}</div></div>; })}{simulationStep === 3 ? <div className="inline-flex w-[72px] items-center justify-center gap-1 rounded-full bg-slate-800 px-3 py-2">{[0, 1, 2].map((index) => <span key={index} className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: `${index * 120}ms` }} />)}</div> : null}</div><div className="border-t border-white/10 px-3 py-2"><div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900 px-3 py-2 text-xs text-slate-500"><span className="h-2 w-2 rounded-full bg-violet-400" />Message...</div></div></div> : null}
        </div>
      </div>
      <div className="mt-6 inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1">{previewTabs.map((item) => <button key={item.id} onClick={() => setActivePreviewTab(item.id)} className={`rounded-full px-5 py-2 text-sm font-medium ${activePreviewTab === item.id ? 'bg-white text-slate-900' : 'text-slate-300 hover:text-white'}`}>{item.label}</button>)}</div>
    </div>
  );
};

export default InstagramAutomationBuilder;
