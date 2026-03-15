import React, { useCallback, useEffect, useState } from 'react';
import {
  ChevronDown,
  Pause,
  Play,
  Trash2,
  Workflow,
} from 'lucide-react';
import { message as antMessage, Popconfirm, Spin } from 'antd';
import { instagramApi } from '../../api/instagramApi';

const InstagramAutomationsList: React.FC = () => {
  const [loadingAutomations, setLoadingAutomations] = useState(false);
  const [expandedAutomationId, setExpandedAutomationId] = useState<string | null>(null);
  const [savedAutomations, setSavedAutomations] = useState<any[]>([]);

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
    fetchAutomations();
  }, [fetchAutomations]);

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

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05070d] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(56,189,248,0.16),transparent_36%),radial-gradient(circle_at_90%_8%,rgba(129,140,248,0.16),transparent_40%)]" />
      <div className="relative">
        <main className="bg-[#090e1a] px-6 py-5">
          <h2 className="mb-6 text-xl font-semibold">Your Automations</h2>
          {loadingAutomations ? (
            <div className="flex h-64 items-center justify-center">
              <Spin size="large" />
            </div>
          ) : savedAutomations.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-slate-400">
              <Workflow className="mb-4 h-12 w-12 text-slate-500" />
              <p className="mb-2 text-lg">No automations yet</p>
              <p className="text-sm">Click "Home" tab to create your first automation</p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedAutomations.map((automation: any) => {
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
      </div>
    </div>
  );
};

export default InstagramAutomationsList;
