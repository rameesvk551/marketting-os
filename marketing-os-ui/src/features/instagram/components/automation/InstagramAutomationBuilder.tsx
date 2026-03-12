import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useFieldArray, useForm, useWatch, type UseFormRegister } from 'react-hook-form';
import {
  ArrowRight,
  BarChart3,
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
  Pause,
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
import { message as antMessage, Popconfirm, Spin } from 'antd';
import { CATALOG_PRODUCTS, COMMENT_EXAMPLES, INSTAGRAM_AUTOMATION_NAV, SUGGESTED_KEYWORDS } from './mockData';
import InstagramInboxWorkspace from '../inbox/InstagramInboxWorkspace';
import { useInstagramAutomationStore } from './useInstagramAutomationStore';
import { instagramApi } from '../../api/instagramApi';
import type {
  AutomationBuilderFormValues,
  CatalogProduct,
  InstagramAutomationSchema,
  MessageBlock,
  MessageBlockType,
  PreviewTab,
  TriggerType,
} from './types';

const MAX_KEYWORDS = 20;

const NAV_ICON: Record<(typeof INSTAGRAM_AUTOMATION_NAV)[number]['id'], LucideIcon> = {
  home: Home,
  automations: Workflow,
  inbox: MessageCircle,
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

const TRIGGER_TYPES: Array<{ value: TriggerType; label: string; description: string; icon: LucideIcon }> = [
  { value: 'comment', label: 'Comment on Post', description: 'When someone comments on your posts or reels', icon: MessageSquareText },
  { value: 'dm', label: 'Direct Message', description: 'When someone sends you a DM with keywords', icon: MessageCircle },
  { value: 'conversation_opener', label: 'Conversation Opener', description: 'When someone opens your DM for the first time', icon: Users },
];

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
    type: values.trigger.type,
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
  const [connectedAccount, setConnectedAccount] = useState<{ id: string; username: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAutomations, setSavedAutomations] = useState<any[]>([]);
  const [loadingAutomations, setLoadingAutomations] = useState(false);
  const [expandedAutomationId, setExpandedAutomationId] = useState<string | null>(null);

  const activePreviewTab = useInstagramAutomationStore((state) => state.activePreviewTab);
  const selectedNav = useInstagramAutomationStore((state) => state.selectedNav);
  const simulationStep = useInstagramAutomationStore((state) => state.simulationStep);
  const setActivePreviewTab = useInstagramAutomationStore((state) => state.setActivePreviewTab);
  const setSelectedNav = useInstagramAutomationStore((state) => state.setSelectedNav);
  const cycleSimulationStep = useInstagramAutomationStore((state) => state.cycleSimulationStep);

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
  const triggerType = useWatch({ control, name: 'trigger.type' });
  const keywordFilter = useWatch({ control, name: 'trigger.keywordFilterEnabled' });
  const message = useWatch({ control, name: 'actions.0.message' });

  const schema = useMemo(() => toSchema(values as AutomationBuilderFormValues), [values]);
  const isInboxView = selectedNav === 'inbox';
  const isAutomationsListView = selectedNav === 'automations';

  // Fetch connected Instagram account on mount
  useEffect(() => {
    instagramApi.getConnection()
      .then((res) => {
        if (res.data?.connected && res.data.accounts?.length > 0) {
          const account = res.data.accounts[0];
          setConnectedAccount({ id: account.id, username: account.username });
        }
      })
      .catch((err) => {
        console.error('Failed to fetch Instagram connection:', err);
      });
  }, []);

  // Fetch saved automations when viewing automations list
  const fetchAutomations = useCallback(async () => {
    setLoadingAutomations(true);
    try {
      const res = await instagramApi.getAutomationRules();
      setSavedAutomations(res.data || []);
    } catch (err) {
      console.error('Failed to fetch automations:', err);
    } finally {
      setLoadingAutomations(false);
    }
  }, []);

  useEffect(() => {
    if (selectedNav === 'automations') {
      fetchAutomations();
    }
  }, [selectedNav, fetchAutomations]);

  const handleDeleteAutomation = async (ruleId: string) => {
    try {
      await instagramApi.deleteAutomationRule(ruleId);
      antMessage.success('Automation deleted');
      fetchAutomations();
    } catch (err) {
      antMessage.error('Failed to delete automation');
    }
  };

  const handleToggleStatus = async (ruleId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      await instagramApi.toggleAutomationRuleStatus(ruleId, newStatus);
      antMessage.success(`Automation ${newStatus === 'active' ? 'activated' : 'paused'}`);
      fetchAutomations();
    } catch (err) {
      antMessage.error('Failed to update automation status');
    }
  };

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

  const save = useCallback(async (status: 'draft' | 'active') => {
    if (!connectedAccount) {
      antMessage.error('No Instagram account connected. Please connect your account first.');
      return;
    }

    setSaving(true);
    try {
      setValue('status', status, { shouldDirty: true });
      const formValues = getValues();
      const schema = toSchema({ ...formValues, status });

      // Transform schema to API format
      const payload = {
        accountId: connectedAccount.id,
        name: schema.name || 'Untitled Automation',
        trigger: {
          type: formValues.trigger.type,
          keywords: schema.trigger.keywords,
          keywordFilterEnabled: formValues.trigger.keywordFilterEnabled,
          scope: formValues.trigger.scope,
          postId: formValues.trigger.postId,
        },
        optionalActions: {
          publicReply: formValues.optionalActions?.replyPublic
            ? { enabled: true, message: '✅ Check your DMs!' }
            : { enabled: false, message: '' },
          likeComment: false,
          replyPublic: formValues.optionalActions?.replyPublic,
          sendOpeningDm: formValues.optionalActions?.sendOpeningDm,
          requireFollow: formValues.optionalActions?.requireFollow,
          collectEmail: formValues.optionalActions?.collectEmail,
        },
        actions: [{
          type: 'send_dm' as const,
          message: schema.actions[0]?.message || '',
          blocks: formValues.actions[0]?.blocks || [],
          products: formValues.actions[0]?.products?.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            image: p.image,
            url: p.url || `https://example.com/products/${p.id}`,
            description: p.description,
          })) || [],
        }],
      };

      // Check if editing existing or creating new (valid UUID means existing)
      const existingId = formValues.id;
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(existingId);
      
      if (existingId && isValidUUID) {
        await instagramApi.updateAutomationRule(existingId, payload);
        antMessage.success('Automation updated successfully!');
      } else {
        const result = await instagramApi.createAutomationRule(payload);
        // Update form with new ID
        setValue('id', result.data.id);
        antMessage.success('Automation created successfully!');
      }
    } catch (err: any) {
      console.error('Failed to save automation:', err);
      antMessage.error(err.response?.data?.message || 'Failed to save automation');
    } finally {
      setSaving(false);
    }
  }, [connectedAccount, getValues, setValue]);

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

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05070d] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(56,189,248,0.16),transparent_36%),radial-gradient(circle_at_90%_8%,rgba(129,140,248,0.16),transparent_40%)]" />
      <div className="relative grid min-h-screen grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)_400px]">
        <aside className="border-b border-white/10 bg-[#070b16] px-4 py-5 xl:border-b-0 xl:border-r xl:border-white/10">
          <button onClick={() => setSelectedNav('home')} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-lime-300/60 bg-lime-300 px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-lime-200"><Plus className="h-4 w-4" />New Automation</button>
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

        {/* Automations List View */}
        {isAutomationsListView && (
          <main className="order-2 col-span-2 border-t border-white/10 bg-[#090e1a] px-6 py-5 xl:order-2 xl:border-t-0">
            <h2 className="mb-6 text-xl font-semibold">Your Automations</h2>
            {loadingAutomations ? (
              <div className="flex h-64 items-center justify-center">
                <Spin size="large" />
              </div>
            ) : savedAutomations.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center text-slate-400">
                <Workflow className="mb-4 h-12 w-12 text-slate-500" />
                <p className="mb-2 text-lg">No automations yet</p>
                <p className="text-sm">Click "New Automation" to create your first one</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedAutomations.map((automation) => {
                  const isExpanded = expandedAutomationId === automation.id;
                  return (
                    <div key={automation.id} className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
                      <div 
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02]"
                        onClick={() => setExpandedAutomationId(isExpanded ? null : automation.id)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            <h3 className="font-medium">{automation.name}</h3>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              automation.status === 'active' ? 'bg-green-500/20 text-green-400' :
                              automation.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-slate-500/20 text-slate-400'
                            }`}>
                              {automation.status}
                            </span>
                          </div>
                          <p className="mt-1 ml-7 text-sm text-slate-400">
                            Trigger: {automation.trigger?.type || 'comment'} &bull; Keywords: {automation.trigger?.keywords?.length || 0} &bull; {automation.stats?.triggered || 0} triggered
                          </p>
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleToggleStatus(automation.id, automation.status)}
                            className="rounded-lg border border-white/10 bg-white/5 p-2 hover:bg-white/10"
                            title={automation.status === 'active' ? 'Pause' : 'Activate'}
                          >
                            {automation.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </button>
                          <Popconfirm
                            title="Delete automation?"
                            description="This action cannot be undone."
                            onConfirm={() => handleDeleteAutomation(automation.id)}
                            okText="Delete"
                            cancelText="Cancel"
                            okButtonProps={{ danger: true }}
                          >
                            <button className="rounded-lg border border-white/10 bg-white/5 p-2 hover:bg-red-500/20 hover:text-red-400">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </Popconfirm>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="border-t border-white/10 bg-white/[0.01] p-4 space-y-4">
                          <div>
                            <h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">Trigger Type</h4>
                            <span className="rounded-lg bg-indigo-500/20 px-3 py-1 text-sm text-indigo-300">
                              {automation.trigger?.type === 'comment' ? '💬 Comment on Post' : 
                               automation.trigger?.type === 'dm' ? '📩 Direct Message' : 
                               automation.trigger?.type === 'conversation_opener' ? '👋 Conversation Opener' : 
                               automation.trigger?.type || 'comment'}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">Keywords</h4>
                            <div className="flex flex-wrap gap-2">
                              {(automation.trigger?.keywords || []).length > 0 ? (
                                automation.trigger.keywords.map((kw: string, i: number) => (
                                  <span key={i} className="rounded-lg bg-sky-500/20 px-2 py-1 text-xs text-sky-300">{kw}</span>
                                ))
                              ) : (
                                <span className="text-sm text-slate-500">No keywords (matches all {automation.trigger?.type === 'dm' ? 'messages' : 'comments'})</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">DM Message</h4>
                            <p className="text-sm text-slate-300 bg-slate-800/50 rounded-lg p-3">
                              {automation.actions?.[0]?.message || 'No message configured'}
                            </p>
                          </div>
                          {/* Products Section */}
                          {automation.actions?.[0]?.products?.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">
                                📦 Product Catalog ({automation.actions[0].products.length} items)
                              </h4>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {automation.actions[0].products.slice(0, 6).map((product: any, i: number) => (
                                  <div key={i} className="rounded-lg bg-slate-800/50 p-2 text-center">
                                    {product.image && (
                                      <img src={product.image} alt={product.name} className="h-16 w-full rounded object-cover mb-1" />
                                    )}
                                    <p className="text-xs font-medium truncate">{product.name}</p>
                                    <p className="text-xs text-lime-300">₹{product.price}</p>
                                  </div>
                                ))}
                              </div>
                              {automation.actions[0].products.length > 6 && (
                                <p className="text-xs text-slate-400 mt-2">+{automation.actions[0].products.length - 6} more products</p>
                              )}
                            </div>
                          )}
                          {/* Message Blocks Section */}
                          {automation.actions?.[0]?.blocks?.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">
                                Message Blocks ({automation.actions[0].blocks.length})
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {automation.actions[0].blocks.map((block: any, i: number) => (
                                  <span key={i} className="rounded-lg bg-purple-500/20 px-2 py-1 text-xs text-purple-300">
                                    {block.type === 'text' ? '📝 Text' :
                                     block.type === 'button' ? '🔗 Button' :
                                     block.type === 'image' ? '🖼️ Image' :
                                     block.type === 'product_card' ? '📦 Product Card' :
                                     block.type === 'product_catalog' ? '🛒 Product Catalog' :
                                     block.type === 'cta' ? '🎯 CTA' : block.type}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          <div>
                            <h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">Stats</h4>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="rounded-lg bg-slate-800/50 p-3 text-center">
                                <p className="text-2xl font-bold text-white">{automation.stats?.triggered || 0}</p>
                                <p className="text-xs text-slate-400">Triggered</p>
                              </div>
                              <div className="rounded-lg bg-slate-800/50 p-3 text-center">
                                <p className="text-2xl font-bold text-white">{automation.stats?.dmsSent || automation.stats?.dms_sent || 0}</p>
                                <p className="text-xs text-slate-400">DMs Sent</p>
                              </div>
                              <div className="rounded-lg bg-slate-800/50 p-3 text-center">
                                <p className="text-2xl font-bold text-white">{automation.stats?.repliesSent || automation.stats?.replies_sent || 0}</p>
                                <p className="text-xs text-slate-400">Replies</p>
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-slate-500">
                            Created: {new Date(automation.createdAt).toLocaleDateString()} &bull; 
                            Updated: {new Date(automation.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        )}

        {/* Phone Preview (Builder View) */}
        <main className={`order-3 border-t border-white/10 bg-[#090e1a] px-4 py-5 xl:order-2 xl:border-t-0 xl:px-6 ${isInboxView || isAutomationsListView ? 'hidden' : ''}`}>
          <PhonePreview activePreviewTab={activePreviewTab} setActivePreviewTab={setActivePreviewTab} keywords={keywords.map((item) => item.value)} blocks={blocks} products={products} optional={optional} message={message} simulationStep={simulationStep} />
        </main>
        <aside className={`order-2 border-t border-white/10 bg-[#060914] px-4 py-5 xl:order-3 xl:border-l xl:border-t-0 xl:border-white/10 ${isInboxView || isAutomationsListView ? 'hidden' : ''}`}>
          <div className="mb-4 flex items-center gap-2">
            <button onClick={() => save('draft')} disabled={saving} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50">{saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Save className="h-4 w-4" />}Save Draft</button>
            <button onClick={() => save('active')} disabled={saving} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-lime-300/60 bg-lime-300 px-3 py-2.5 text-sm font-semibold text-slate-900 hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-50">{saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-500/30 border-t-slate-900" /> : <Play className="h-4 w-4" />}Start</button>
          </div>
          <div className="space-y-4 xl:max-h-[calc(100vh-290px)] xl:overflow-y-auto xl:pr-1">
            {/* Trigger Type Selection */}
            <Section step={1} title="Trigger Type" done={!!triggerType}>
              <div className="space-y-2">
                {TRIGGER_TYPES.map((item) => {
                  const Icon = item.icon;
                  const active = item.value === triggerType;
                  return (
                    <div 
                      key={item.value} 
                      onClick={() => setValue('trigger.type', item.value)}
                      className={`cursor-pointer rounded-xl border p-3 transition-all ${active ? 'border-sky-300/40 bg-sky-400/10' : 'border-white/10 bg-white/[0.02] hover:border-white/20'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`rounded-lg p-2 ${active ? 'bg-sky-300/20' : 'bg-white/5'}`}>
                          <Icon className={`h-4 w-4 ${active ? 'text-sky-300' : 'text-slate-400'}`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-slate-400">{item.description}</p>
                        </div>
                        <div className={`h-4 w-4 rounded-full border-2 ${active ? 'border-sky-300 bg-sky-300' : 'border-white/30'}`}>
                          {active && <Check className="h-3 w-3 -ml-[1px] -mt-[1px] text-slate-900" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>

            {/* Comment-specific: Post/Reel Selection */}
            {triggerType === 'comment' && (
              <Section step={2} title="Which Post/Reel">
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
            )}

            {/* Keywords Section - for comment and dm triggers */}
            {(triggerType === 'comment' || triggerType === 'dm') && (
            <Section step={triggerType === 'comment' ? 3 : 2} title={triggerType === 'comment' ? "And comment contains" : "When message contains"} done={keywordFilter}>
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
            )}

            {/* Optional Actions - for comment triggers */}
            {triggerType === 'comment' && (
            <Section step={4} title="Optional actions">
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
            )}

            {/* DM Message Builder */}
            <Section step={triggerType === 'comment' ? 5 : triggerType === 'dm' ? 3 : 2} title="Send this DM" done>
              <div className="space-y-3">
                <textarea {...register('actions.0.message')} rows={3} className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm outline-none focus:border-sky-300/60" placeholder="Opening DM message" />
                
                {/* Selected Products Preview */}
                {products && products.length > 0 && (
                  <div className="rounded-xl border border-lime-300/30 bg-lime-300/5 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-lime-300">📦 {products.length} Products Selected</p>
                      <button onClick={openCatalog} className="text-xs text-lime-300 hover:underline">Edit</button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {products.slice(0, 4).map((p) => (
                        <div key={p.id} className="flex-shrink-0 w-16">
                          <img src={p.image} alt={p.name} className="h-12 w-16 rounded object-cover" />
                          <p className="text-[10px] text-slate-300 truncate">{p.name}</p>
                        </div>
                      ))}
                      {products.length > 4 && (
                        <div className="flex-shrink-0 w-16 h-12 rounded bg-white/10 flex items-center justify-center text-xs text-slate-400">
                          +{products.length - 4}
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">💡 Add a "Product catalog" block below to include these in the DM</p>
                  </div>
                )}

                {/* No Products Warning */}
                {(!products || products.length === 0) && (
                  <div className="rounded-xl border border-amber-300/30 bg-amber-300/5 p-3">
                    <p className="text-xs text-amber-300">⚠️ No products selected</p>
                    <p className="text-[10px] text-slate-400 mt-1">Click "Catalog Picker" to select products for your automation</p>
                    <button onClick={openCatalog} className="mt-2 rounded-lg border border-amber-300/40 bg-amber-300/10 px-3 py-1.5 text-xs text-amber-300 hover:bg-amber-300/20">
                      <ShoppingBag className="inline h-3 w-3 mr-1" />Select Products
                    </button>
                  </div>
                )}

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
        {isInboxView ? (
          <main className="order-2 border-t border-white/10 bg-[#090e1a] px-4 py-5 xl:order-2 xl:col-span-2 xl:border-t-0 xl:px-6">
            <div className="h-[calc(100vh-120px)] min-h-[560px] overflow-hidden rounded-2xl border border-white/10">
              <InstagramInboxWorkspace embedded />
            </div>
          </main>
        ) : null}
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
      <div className="w-full rounded-[42px] border-4 border-slate-800 bg-black p-2 shadow-2xl">
        <div className="relative h-[680px] overflow-hidden rounded-[36px] bg-black">
          {/* Dynamic Island */}
          <div className="absolute left-1/2 top-3 z-10 h-8 w-28 -translate-x-1/2 rounded-full bg-black" />
          
          {activePreviewTab === 'post' ? (
            <div className="flex h-full flex-col bg-black">
              {/* Instagram Post Header */}
              <div className="flex items-center justify-between px-3 pb-2 pt-14">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-black">
                      <span className="text-[10px] font-bold text-white">W</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-white">wayout_in</p>
                    <p className="text-[11px] text-slate-400">Sponsored</p>
                  </div>
                </div>
                <button className="text-white">•••</button>
              </div>
              
              {/* Post Image */}
              <img 
                src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80" 
                alt="Post" 
                className="aspect-square w-full object-cover" 
              />
              
              {/* Action Icons */}
              <div className="flex items-center justify-between px-3 py-3">
                <div className="flex items-center gap-4">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </div>
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
              </div>
              
              {/* Likes */}
              <p className="px-3 text-[13px] font-semibold text-white">2,847 likes</p>
              
              {/* Caption */}
              <div className="px-3 py-2">
                <p className="text-[13px] text-white">
                  <span className="font-semibold">wayout_in</span>{' '}
                  Comment <span className="font-semibold text-sky-400">"{keyword}"</span> and we'll DM you the catalog! 🛍️✨
                </p>
              </div>
              
              {/* View Comments */}
              <button className="px-3 text-left text-[13px] text-slate-400">View all 156 comments</button>
              
              {/* Sample Comment */}
              <div className="mt-1 px-3">
                <p className="text-[13px] text-white">
                  <span className="font-semibold">fashion_lover</span> {keyword} pls! 🔥
                </p>
              </div>
              
              {/* Time */}
              <p className="px-3 pt-1 text-[11px] text-slate-500">2 HOURS AGO</p>
              
              {/* Comment Input */}
              <div className="mt-auto flex items-center gap-3 border-t border-white/10 px-3 py-3">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-black text-[8px] text-white">Y</div>
                </div>
                <p className="flex-1 text-[13px] text-slate-500">Add a comment...</p>
                <span className="text-lg">😀</span>
              </div>
            </div>
          ) : null}
          
          {activePreviewTab === 'comments' ? (
            <div className="flex h-full flex-col bg-black">
              {/* Comments Header */}
              <div className="flex items-center justify-between border-b border-white/10 px-4 pb-3 pt-14">
                <button className="text-white"><ArrowRight className="h-5 w-5 rotate-180" /></button>
                <p className="text-[15px] font-semibold text-white">Comments</p>
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </div>
              
              {/* Comments List */}
              <div className="flex-1 overflow-y-auto p-4">
                {COMMENT_EXAMPLES.map((item) => { 
                  const hit = item.text.toLowerCase().includes(keyword.toLowerCase()); 
                  return (
                    <div key={item.id} className="mb-4 flex gap-3">
                      <div className={`h-8 w-8 flex-shrink-0 rounded-full ${hit ? 'bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 p-[2px]' : 'bg-slate-700'}`}>
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">
                          {item.user.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-[13px] text-white">
                          <span className="font-semibold">{item.user}</span>{' '}
                          {item.text}
                        </p>
                        <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500">
                          <span>{item.time}</span>
                          <button className="font-semibold">Reply</button>
                          {hit && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] text-green-400">
                              <Check className="h-3 w-3" />Keyword Match
                            </span>
                          )}
                        </div>
                      </div>
                      <button className="text-slate-500">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                      </button>
                    </div>
                  );
                })}
              </div>
              
              {/* Comment Input */}
              <div className="flex items-center gap-3 border-t border-white/10 px-4 py-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-black text-[10px] text-white">Y</div>
                </div>
                <p className="flex-1 text-[13px] text-slate-500">Add a comment as you...</p>
                <span className="text-lg">😀</span>
              </div>
            </div>
          ) : null}

          {activePreviewTab === 'dm' ? (
            <div className="flex h-full flex-col bg-black">
              {/* DM Header */}
              <div className="flex items-center gap-3 border-b border-white/10 px-4 pb-3 pt-14">
                <button className="text-white"><ArrowRight className="h-5 w-5 rotate-180" /></button>
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">W</div>
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-semibold text-white">wayout_in</p>
                  <p className="text-[11px] text-slate-400">Active now</p>
                </div>
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </div>
              
              {/* Chat Messages */}
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {/* User's trigger message */}
                <div className="flex justify-end">
                  <div className="max-w-[75%] rounded-3xl rounded-br-md bg-gradient-to-r from-purple-600 to-pink-500 px-4 py-2.5">
                    <p className="text-[14px] text-white">Commented "{keyword}" on your post 💬</p>
                  </div>
                </div>
                
                {/* Opening DM */}
                {optional.sendOpeningDm && (
                  <div className="flex justify-start">
                    <div className="max-w-[75%] rounded-3xl rounded-bl-md bg-slate-800 px-4 py-2.5">
                      <p className="text-[14px] text-white">Hey! Thanks for your interest 🙌</p>
                    </div>
                  </div>
                )}
                
                {/* Main message */}
                <div className="flex justify-start">
                  <div className="max-w-[75%] rounded-3xl rounded-bl-md bg-slate-800 px-4 py-2.5">
                    <p className="text-[14px] text-white">{message || "Here's what you requested!"}</p>
                  </div>
                </div>
                
                {/* Message blocks */}
                {blocks.map((block) => { 
                  if (block.type === 'text') return (
                    <div key={block.id} className="flex justify-start">
                      <div className="max-w-[75%] rounded-3xl rounded-bl-md bg-slate-800 px-4 py-2.5">
                        <p className="text-[14px] text-white">{block.text}</p>
                      </div>
                    </div>
                  );
                  if (block.type === 'button') return (
                    <div key={block.id} className="flex justify-start">
                      <button className="inline-flex max-w-[75%] items-center gap-2 rounded-2xl border border-white/20 bg-slate-800 px-4 py-2.5 text-[14px] text-sky-400">
                        <Link2 className="h-4 w-4" />{block.label || 'View Link'}
                      </button>
                    </div>
                  );
                  if (block.type === 'cta') return (
                    <div key={block.id} className="flex justify-start">
                      <button className="inline-flex max-w-[75%] items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 px-4 py-2.5 text-[14px] font-semibold text-white">
                        <MousePointerClick className="h-4 w-4" />{block.ctaLabel || 'Shop Now'}
                      </button>
                    </div>
                  );
                  if (block.type === 'image') return (
                    <div key={block.id} className="flex justify-start">
                      <img src={block.imageUrl} alt="Shared" className="h-40 max-w-[75%] rounded-2xl object-cover" />
                    </div>
                  );
                  if (block.type === 'product_card') { 
                    const product = resolveProduct(block.productId); 
                    return (
                      <div key={block.id} className="flex justify-start">
                        <div className="w-[75%] overflow-hidden rounded-2xl border border-white/10 bg-slate-800">
                          <img src={product.image} alt={product.name} className="h-32 w-full object-cover" />
                          <div className="p-3">
                            <p className="text-[14px] font-semibold text-white">{product.name}</p>
                            <p className="text-[13px] text-slate-400">{product.description}</p>
                            <p className="mt-1 text-[15px] font-bold text-white">₹{product.price}</p>
                            <button className="mt-2 w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 py-2 text-[13px] font-semibold text-white">
                              {block.ctaLabel || product.ctaLabel}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  // Product catalog carousel
                  const list = products.length ? products : CATALOG_PRODUCTS.slice(0, 3); 
                  return (
                    <div key={block.id} className="w-full">
                      <p className="mb-2 px-1 text-[12px] text-slate-400">{block.text || 'Featured Products'}</p>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {list.map((product) => (
                          <div key={product.id} className="min-w-[140px] overflow-hidden rounded-xl border border-white/10 bg-slate-800">
                            <img src={product.image} alt={product.name} className="h-24 w-full object-cover" />
                            <div className="p-2">
                              <p className="line-clamp-1 text-[12px] font-medium text-white">{product.name}</p>
                              <p className="text-[12px] font-bold text-white">₹{product.price}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                
                {/* Typing indicator */}
                {simulationStep === 3 && (
                  <div className="flex justify-start">
                    <div className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-4 py-2.5">
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${i * 150}ms` }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Message Input */}
              <div className="flex items-center gap-2 border-t border-white/10 px-3 py-3">
                <button className="rounded-full bg-gradient-to-r from-purple-600 to-pink-500 p-2">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
                <div className="flex flex-1 items-center rounded-full border border-white/20 bg-slate-900 px-4 py-2">
                  <p className="flex-1 text-[14px] text-slate-500">Message...</p>
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="text-lg">😊</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      
      {/* Preview Tabs */}
      <div className="mt-6 inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1">
        {previewTabs.map((item) => (
          <button 
            key={item.id} 
            onClick={() => setActivePreviewTab(item.id)} 
            className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${activePreviewTab === item.id ? 'bg-white text-slate-900' : 'text-slate-300 hover:text-white'}`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default InstagramAutomationBuilder;
