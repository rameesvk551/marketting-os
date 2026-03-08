import React from 'react';
import {
    LogOut,
    Users,
    Heart,
    Image as ImageIcon,
    TrendingUp,
    Activity,
    PlusSquare,
    Upload,
    CalendarClock,
    MessageSquare,
    MoreHorizontal
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

// Mock data for analytics
const analyticsData = [
    { name: 'Mon', followers: 4000 },
    { name: 'Tue', followers: 4100 },
    { name: 'Wed', followers: 4250 },
    { name: 'Thu', followers: 4200 },
    { name: 'Fri', followers: 4400 },
    { name: 'Sat', followers: 4600 },
    { name: 'Sun', followers: 4800 },
];

// Mock data for recent posts
const recentPosts = [
    { id: 1, image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=500&q=80', likes: 1240, comments: 45, date: '2 hours ago' },
    { id: 2, image: 'https://images.unsplash.com/photo-1516245834210-c4c142787335?w=500&q=80', likes: 856, comments: 23, date: '1 day ago' },
    { id: 3, image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&q=80', likes: 2100, comments: 112, date: '3 days ago' },
];

export interface InstagramAccountProps {
    account: {
        id: string;
        username: string;
        name?: string;
        profilePictureUrl?: string;
        accountType?: string;
        followersCount?: number;
        followsCount?: number;
        mediaCount?: number;
        status?: string;
        lastSyncedAt?: string;
    } | any;
    onDisconnect: (id: string) => void;
    isDisconnecting?: boolean;
}

const InstagramDashboardOverview: React.FC<InstagramAccountProps> = ({ account, onDisconnect, isDisconnecting }) => {
    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full font-sans text-slate-900 pb-12">

            {/* 1. Account Overview Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row items-center justify-between p-6 gap-6 relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E1306C] to-[#833AB4]"></div>

                <div className="flex items-center gap-5">
                    <div className="relative">
                        <img
                            src={account?.profilePictureUrl || `https://ui-avatars.com/api/?name=${account?.username || 'IG'}&background=random`}
                            alt={account?.username}
                            className="w-20 h-20 rounded-full object-cover border-2 border-slate-100 shadow-sm"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-2 border-white"></div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-semibold tracking-tight m-0 text-slate-900">@{account?.username || 'instagram_user'}</h2>
                            <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-0.5 rounded-full font-medium border border-slate-200">
                                {account?.accountType || 'Business'}
                            </span>
                        </div>
                        <p className="text-slate-500 text-sm m-0">{account?.name || 'Instagram Business Account'}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            <span className="text-xs font-medium text-slate-600">Connected & Active</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                    <button
                        onClick={() => onDisconnect(account?.id)}
                        disabled={isDisconnecting}
                        className="w-full md:w-auto px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                        <LogOut className="w-4 h-4" />
                        {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                    </button>
                </div>
            </div>

            {/* 2. Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <MetricCard
                    title="Followers"
                    value={(account?.followersCount || 12450).toLocaleString()}
                    icon={<Users className="w-5 h-5 text-blue-500" />}
                    trend="+12%"
                    trendUp={true}
                />
                <MetricCard
                    title="Following"
                    value={(account?.followsCount || 842).toLocaleString()}
                    icon={<Users className="w-5 h-5 text-slate-400" />}
                />
                <MetricCard
                    title="Posts"
                    value={(account?.mediaCount || 342).toLocaleString()}
                    icon={<ImageIcon className="w-5 h-5 text-orange-500" />}
                    trend="+3"
                    trendUp={true}
                />
                <MetricCard
                    title="Engagement"
                    value="4.2%"
                    icon={<Activity className="w-5 h-5 text-rose-500" />}
                    trend="+0.8%"
                    trendUp={true}
                />
                <MetricCard
                    title="Reach"
                    value="84.2K"
                    icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
                    trend="+24%"
                    trendUp={true}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Quick Actions & Recent Posts */}
                <div className="lg:col-span-2 flex flex-col gap-6">

                    {/* 3. Quick Actions Section */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-base font-semibold text-slate-800 m-0">Quick Actions</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <ActionButton icon={<PlusSquare className="w-5 h-5 text-indigo-600" />} label="Create Post" />
                            <ActionButton icon={<Upload className="w-5 h-5 text-rose-600" />} label="Upload Media" />
                            <ActionButton icon={<CalendarClock className="w-5 h-5 text-amber-600" />} label="Schedule Post" />
                            <ActionButton icon={<MessageSquare className="w-5 h-5 text-emerald-600" />} label="View Messages" />
                        </div>
                    </div>

                    {/* 4. Recent Posts Section */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-base font-semibold text-slate-800 m-0">Recent Posts</h3>
                            <button className="text-sm font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors">
                                View All <MoreHorizontal className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {recentPosts.map(post => (
                                <div key={post.id} className="group relative rounded-xl overflow-hidden cursor-pointer border border-slate-100 aspect-square">
                                    <img src={post.image} alt="Post" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                        <div className="flex items-center justify-between text-white">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1"><Heart className="w-4 h-4 fill-white" /> <span className="text-xs font-medium">{post.likes}</span></div>
                                                <div className="flex items-center gap-1"><MessageSquare className="w-4 h-4 fill-white" /> <span className="text-xs font-medium">{post.comments}</span></div>
                                            </div>
                                            <span className="text-[10px] font-medium opacity-80">{post.date}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Right Column: Analytics Preview */}
                <div className="lg:col-span-1">
                    {/* 5. Analytics Preview */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-base font-semibold text-slate-800 m-0 leading-tight">Follower Growth</h3>
                                <p className="text-sm text-slate-500 mt-1 m-0">Past 7 days</p>
                            </div>
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">+24.5%</span>
                        </div>

                        <div className="flex-1 min-h-[220px] w-full mt-4 -ml-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={analyticsData}>
                                    <defs>
                                        <linearGradient id="colorFollowers" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                        dx={-10}
                                    />
                                    <RechartsTooltip
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ color: '#0f172a', fontWeight: 600 }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="followers"
                                        stroke="#8b5cf6"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorFollowers)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

// Sub-components

const MetricCard = ({ title, value, icon, trend, trendUp }: { title: string, value: string | number, icon: React.ReactNode, trend?: string, trendUp?: boolean }) => (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">{title}</span>
            <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
        </div>
        <div className="flex items-baseline gap-2">
            <h4 className="text-2xl font-bold tracking-tight text-slate-800 m-0">{value}</h4>
            {trend && (
                <span className={`text-xs font-semibold ${trendUp ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'} px-1.5 py-0.5 rounded-md`}>
                    {trend}
                </span>
            )}
        </div>
    </div>
);

const ActionButton = ({ icon, label }: { icon: React.ReactNode, label: string }) => (
    <button className="flex flex-col items-center justify-center p-4 gap-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 hover:border-slate-200 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
        <div className="p-3 bg-white rounded-lg shadow-sm border border-slate-100">
            {icon}
        </div>
        <span className="text-xs font-semibold text-slate-700">{label}</span>
    </button>
);

export default InstagramDashboardOverview;
