import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  Camera,
  ChevronDown,
  Cog,
  Gauge,
  ImagePlus,
  KeyRound,
  Layers,
  MessageCircle,
  Search,
  Send,
  Settings,
  Smile,
  Users,
  Workflow,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

type ChatMessage = {
  id: string;
  side: 'left' | 'right' | 'system';
  text?: string;
  time?: string;
  avatar?: string;
  type?: 'text' | 'product';
  product?: {
    shop: string;
    image: string;
    title: string;
    price: string;
  };
};

type Conversation = {
  id: string;
  name: string;
  snippet: string;
  time: string;
  avatar: string;
  unread?: boolean;
  meta?: string;
};

type SidebarItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  route?: '/instagram' | '/instagram/automation';
  active?: (pathname: string) => boolean;
};

const initialConversations: Conversation[] = [
  {
    id: 'sofi',
    name: 'Sofi Bird',
    snippet: 'Mentioned you in their story',
    time: 'Now',
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    meta: 'story',
  },
  {
    id: 'masudur',
    name: 'Masudur Rahman',
    snippet: 'Yeah, let me know when you are planning to go!',
    time: '1:39 PM',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    unread: true,
  },
  {
    id: 'paul',
    name: 'Paul Flavins Nechita',
    snippet: 'Yeah, let me know when you are...',
    time: 'Sep 13',
    avatar: 'https://randomuser.me/api/portraits/men/46.jpg',
  },
  {
    id: 'andrew-a',
    name: 'Andrew McKay',
    snippet: 'Thanks!',
    time: 'Aug 18',
    avatar: 'https://randomuser.me/api/portraits/men/51.jpg',
  },
  {
    id: 'andrew-b',
    name: 'Andrew McKay',
    snippet: 'Yeah, let me know',
    time: 'Sep 13',
    avatar: 'https://randomuser.me/api/portraits/men/52.jpg',
  },
];

const initialMessagesByConversation: Record<string, ChatMessage[]> = {
  masudur: [
    { id: 'm-1', side: 'system', text: 'Yesterday' },
    {
      id: 'm-2',
      side: 'left',
      text: 'Yeah, let me know when you are planning to go! rd want to join as well.',
      time: '12:14 PM',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      type: 'text',
    },
    {
      id: 'm-3',
      side: 'right',
      text: 'okay',
      time: '1:17 PM',
      type: 'text',
    },
    {
      id: 'm-4',
      side: 'left',
      text: 'version we show all dialog content as plain text',
      time: '1:23 PM',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      type: 'text',
    },
    { id: 'm-5', side: 'system', text: 'Assigned to Andrew Demeter at 1:29 PM, Dec 7' },
    {
      id: 'm-6',
      side: 'left',
      time: '1:39 PM',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      type: 'product',
      product: {
        shop: 'Bootleg Store',
        image:
          'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
        title: 'Silk Paisley Patch Asymmetrical Dress',
        price: '$1,299',
      },
    },
  ],
  sofi: [
    { id: 's-1', side: 'system', text: 'Today' },
    {
      id: 's-2',
      side: 'left',
      text: 'I mentioned your page in my story.',
      time: '10:11 AM',
      avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
      type: 'text',
    },
    { id: 's-3', side: 'right', text: 'Thanks, I saw it!', time: '10:15 AM', type: 'text' },
  ],
  paul: [{ id: 'p-1', side: 'system', text: 'No conversation selected yet' }],
  'andrew-a': [{ id: 'a-1', side: 'system', text: 'No conversation selected yet' }],
  'andrew-b': [{ id: 'b-1', side: 'system', text: 'No conversation selected yet' }],
};

const sidebarItems: SidebarItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Gauge },
  { id: 'automation', label: 'Automation', icon: Workflow, route: '/instagram/automation', active: (pathname) => pathname.startsWith('/instagram/automation') },
  { id: 'flows', label: 'Flows', icon: Layers },
  { id: 'keywords', label: 'Keywords', icon: KeyRound },
  { id: 'live-chat', label: 'Live Chat', icon: MessageCircle, route: '/instagram', active: (pathname) => pathname === '/instagram' },
  { id: 'audience', label: 'Audience', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Cog },
];

const formatNow = (): string => {
  const stamp = new Date();
  return stamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

interface InstagramInboxWorkspaceProps {
  embedded?: boolean;
}

const InstagramInboxWorkspace: React.FC<InstagramInboxWorkspaceProps> = ({ embedded = false }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobilePane, setMobilePane] = useState<'list' | 'chat'>('list');
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<string>('masudur');
  const [draft, setDraft] = useState<string>('Hi Vivien!');
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, ChatMessage[]>>(initialMessagesByConversation);

  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === activeConversationId) ?? conversations[0],
    [activeConversationId, conversations],
  );
  const activeMessages = messagesByConversation[activeConversation?.id || ''] || [];

  const openConversation = (id: string) => {
    setActiveConversationId(id);
    setMobilePane('chat');
    setConversations((previous) =>
      previous.map((item) => (item.id === id ? { ...item, unread: false } : item)),
    );
  };

  const handleSend = () => {
    const text = draft.trim();
    if (!text || !activeConversation) return;

    const currentTime = formatNow();
    const newMessage: ChatMessage = {
      id: `new-${Date.now()}`,
      side: 'right',
      text,
      time: currentTime,
      type: 'text',
    };

    setMessagesByConversation((previous) => ({
      ...previous,
      [activeConversation.id]: [...(previous[activeConversation.id] || []), newMessage],
    }));

    setConversations((previous) =>
      previous.map((item) =>
        item.id === activeConversation.id ? { ...item, snippet: text, time: currentTime } : item,
      ),
    );

    setDraft('');
  };

  return (
    <div className={`${embedded ? 'h-full min-h-0 bg-[#eef1f6] text-slate-900' : 'min-h-screen bg-[#eef1f6] p-0 text-slate-900 sm:p-6'}`}>
      <div
        className={`${
          embedded
            ? 'flex h-full w-full overflow-hidden border border-slate-200 bg-white'
            : 'mx-auto flex min-h-screen w-full max-w-[1400px] overflow-hidden border border-slate-200 bg-white sm:min-h-[calc(100vh-3rem)] sm:rounded-2xl sm:shadow-[0_24px_64px_rgba(15,23,42,0.18)]'
        }`}
      >
        {!embedded ? (
          <aside className="hidden w-[74px] flex-col justify-between bg-[#102349] py-5 text-slate-100 md:flex">
            <div>
              <div className="px-3 pb-5 text-center text-sm font-semibold tracking-tight">chatfuel</div>
              <nav className="space-y-1 px-2">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  const active = item.active ? item.active(location.pathname) : false;
                  return (
                    <button
                      key={item.id}
                      onClick={() => item.route && navigate(item.route)}
                      className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[11px] ${
                        active ? 'bg-sky-400/20 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
            <button className="mx-2 rounded-lg border border-rose-400/40 bg-rose-400/10 px-2 py-2 text-left text-[11px] font-medium text-rose-200 hover:bg-rose-400/20">
              Upgrade
            </button>
          </aside>
        ) : null}

        <section className={`w-full border-r border-slate-200 bg-white md:w-[340px] ${mobilePane === 'list' ? 'flex' : 'hidden md:flex'} flex-col`}>
          <div className="border-b border-slate-200 px-4 py-3">
            <div className="mb-3 flex items-center justify-between">
              <button className="inline-flex items-center gap-1 text-sm font-semibold text-slate-800">
                Instagram <ChevronDown className="h-4 w-4 text-slate-500" />
              </button>
              <button className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100">
                <Settings className="h-4 w-4" />
              </button>
            </div>
            <button className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-slate-600">
              Inbox
              <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-100 px-1 text-[11px] text-slate-500">
                6
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
            </button>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-violet-300 focus:bg-white"
                placeholder="Search"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.map((conversation) => {
              const isActive = conversation.id === activeConversation?.id;
              return (
                <button
                  key={conversation.id}
                  onClick={() => openConversation(conversation.id)}
                  className={`flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition ${
                    isActive ? 'bg-slate-50' : 'bg-white hover:bg-slate-50/70'
                  }`}
                >
                  <img
                    src={conversation.avatar}
                    alt={conversation.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-slate-800">{conversation.name}</p>
                      <span className="shrink-0 text-xs text-slate-500">{conversation.time}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <p className="truncate text-xs text-slate-500">{conversation.snippet}</p>
                      {conversation.unread ? <span className="h-2 w-2 shrink-0 rounded-full bg-sky-500" /> : null}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className={`flex-1 flex-col bg-[#f8f9fc] ${mobilePane === 'chat' ? 'flex' : 'hidden md:flex'}`}>
          <div className="border-b border-slate-200 bg-white px-4 py-3 md:hidden">
            <button
              onClick={() => setMobilePane('list')}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
              {activeConversation?.name}
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-5 sm:px-7">
            {activeMessages.map((message) => {
              if (message.side === 'system') {
                return (
                  <div key={message.id} className="text-center text-[11px] font-medium text-slate-400">
                    {message.text}
                  </div>
                );
              }

              const isRight = message.side === 'right';
              const alignClass = isRight ? 'justify-end' : 'justify-start';
              const bubbleClass = isRight
                ? 'bg-violet-500 text-white rounded-br-md'
                : 'bg-[#edf1f7] text-slate-700 rounded-bl-md';

              return (
                <div key={message.id} className={`flex ${alignClass}`}>
                  <div className={`max-w-[85%] ${isRight ? '' : 'mr-auto'}`}>
                    <div className="flex items-end gap-2">
                      {!isRight && message.avatar ? (
                        <img src={message.avatar} alt="" className="h-6 w-6 rounded-full object-cover" />
                      ) : null}

                      {message.type === 'product' && message.product ? (
                        <div className="w-[260px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                          <div className="border-b border-slate-100 px-3 py-2 text-center text-xs font-semibold text-slate-500">
                            {message.product.shop}
                          </div>
                          <img
                            src={message.product.image}
                            alt={message.product.title}
                            className="h-44 w-full object-cover"
                          />
                          <div className="px-3 py-2">
                            <p className="truncate text-xs font-semibold text-slate-700">{message.product.title}</p>
                            <p className="text-xs text-slate-500">{message.product.price}</p>
                          </div>
                        </div>
                      ) : (
                        <div className={`rounded-2xl px-3.5 py-2 text-sm leading-[1.35rem] ${bubbleClass}`}>
                          {message.text}
                        </div>
                      )}
                    </div>
                    {message.time ? (
                      <p className={`mt-1 text-[11px] text-slate-400 ${isRight ? 'text-right' : 'text-left'}`}>
                        {message.time}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-200 bg-white px-4 py-4 sm:px-7">
            <div className="rounded-xl border border-slate-200 bg-white">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Type a message..."
                rows={2}
                className="w-full resize-none rounded-t-xl border-none px-3 py-2 text-sm outline-none"
              />
              <div className="flex items-center justify-between border-t border-slate-200 px-3 py-2">
                <div className="inline-flex items-center gap-1">
                  <button className="rounded-md p-1.5 text-violet-500 hover:bg-violet-50">
                    <MessageCircle className="h-4 w-4" />
                  </button>
                  <button className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100">
                    <ImagePlus className="h-4 w-4" />
                  </button>
                  <button className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100">
                    <Camera className="h-4 w-4" />
                  </button>
                  <button className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100">
                    <Smile className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={handleSend}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700 hover:text-slate-900"
                >
                  Send <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default InstagramInboxWorkspace;
