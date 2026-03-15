'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { BarChart3, Clock, Users, FileText, CheckCircle2, AlertTriangle, MessageSquare, Loader2, RefreshCw, ChevronLeft, ChevronRight, Calendar, TrendingUp } from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';

interface AnalyticsData {
    summary: {
        totalChats: number;
        openChats: number;
        resolvedChats: number;
        escalatedChats: number;
        totalEmailsRaw: number;
        totalEmailsSent: number;
        resolutionRate: number;
    };
    charts: {
        departmentDistribution: { name: string; value: number }[];
        topIssues: { name: string; value: number }[];
        topAgents: { name: string; chatsHandled: number }[];
        departmentTrends: { departmentName: string; trend: { date: string; count: number }[] }[];
        chatSpikes: { hour: string; count: number }[];
        emailsSentByDept: { name: string; value: number }[];
    };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function DashboardPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Date filter
    const [dateRange, setDateRange] = useState('allTime');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    const [currentTrendIndex, setCurrentTrendIndex] = useState(0);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const today = new Date();
            let startDate = new Date();
            let finalEndDate = today;

            if (dateRange === 'custom') {
                if (!customStart || !customEnd) {
                    // Don't fetch if custom dates aren't set yet
                    setLoading(false);
                    return;
                }
                startDate = new Date(customStart);
                finalEndDate = new Date(customEnd);
                // Ensure end date includes the full day
                finalEndDate.setHours(23, 59, 59, 999);
            } else {
                switch (dateRange) {
                    case '7days': startDate.setDate(today.getDate() - 7); break;
                    case '30days': startDate.setDate(today.getDate() - 30); break;
                    case 'thisYear':
                        startDate.setFullYear(today.getFullYear(), 0, 1);
                        finalEndDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
                        break;
                    case 'allTime': break; // handled in backend
                    default: startDate.setDate(today.getDate() - 30);
                }
            }

            const query = new URLSearchParams({
                startDate: startDate.toISOString(),
                endDate: finalEndDate.toISOString(),
                ...(dateRange === 'allTime' && { allTime: 'true' })
            });

            const res = await fetch(`/api/analytics?${query.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch analytics data');

            const json = await res.json();
            setData(json);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (dateRange !== 'custom' || (dateRange === 'custom' && customStart && customEnd)) {
            fetchAnalytics();
        }
    }, [dateRange, customStart, customEnd]);

    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-slate-500">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                <p className="font-medium">Compiling Analytics...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="p-6 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/50 flex items-center justify-center h-64">
                <div className="text-center">
                    <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-red-500" />
                    <p className="font-medium text-lg">Error loading dashboard</p>
                    <p className="text-sm mt-1">{error}</p>
                    <button onClick={fetchAnalytics} className="mt-4 px-4 py-2 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/40 text-sm font-medium transition-colors">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const { summary, charts } = data;

    const KpiCard = ({ title, value, icon: Icon, colorClass, subtitle }: any) => (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className={`p-4 rounded-xl shrink-0 ${colorClass}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{value}</h3>
                {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>}
            </div>
        </div>
    );

    return (
        <div className="space-y-6 pb-12">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-blue-600" />
                        Performance Dashboard
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Overview of support chat volume and resolution metrics.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Link href="/dashboard/analytics" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm">
                        View Extensive Analytics
                    </Link>
                    {dateRange === 'custom' && (
                        <div className="flex flex-wrap md:flex-nowrap items-center gap-2">
                            <input
                                type="date"
                                value={customStart}
                                onChange={(e) => setCustomStart(e.target.value)}
                                className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm shadow-sm"
                            />
                            <span className="text-slate-500 dark:text-slate-400">to</span>
                            <input
                                type="date"
                                value={customEnd}
                                onChange={(e) => setCustomEnd(e.target.value)}
                                className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm shadow-sm"
                            />
                        </div>
                    )}
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors sm:text-sm font-medium shadow-sm"
                    >
                        <option value="allTime">All Time</option>
                        <option value="7days">Last 7 Days</option>
                        <option value="30days">Last 30 Days</option>
                        <option value="thisYear">This Year</option>
                        <option value="custom">Custom Range</option>
                    </select>

                    <button
                        onClick={fetchAnalytics}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm"
                        title="Refresh Dashboard"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard
                    title="Total Chats"
                    value={summary.totalChats}
                    icon={MessageSquare}
                    colorClass="bg-blue-50 text-blue-600"
                />
                <KpiCard
                    title="Resolution Rate"
                    value={`${summary.resolutionRate}%`}
                    icon={CheckCircle2}
                    colorClass="bg-green-50 text-green-600"
                    subtitle={`${summary.resolvedChats} resolved chats`}
                />
                <KpiCard
                    title="Total Emails Sent"
                    value={summary.totalEmailsSent}
                    icon={MessageSquare}
                    colorClass="bg-purple-50 text-purple-600"
                />
                <KpiCard
                    title="Escalated / Open"
                    value={`${summary.escalatedChats} / ${summary.openChats}`}
                    icon={AlertTriangle}
                    colorClass="bg-red-50 text-red-600"
                />
            </div>

            {/* Main Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Trend Chart (Full Width) */}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 col-span-1 lg:col-span-3">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-slate-400" />
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                                Chat Volume Trend ({charts.departmentTrends?.[currentTrendIndex]?.departmentName || 'Loading'})
                            </h3>
                        </div>
                        {charts.departmentTrends && charts.departmentTrends.length > 1 && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentTrendIndex(prev => prev > 0 ? prev - 1 : charts.departmentTrends.length - 1)}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5 text-slate-500" />
                                </button>
                                <span className="text-sm font-medium text-slate-500">
                                    {currentTrendIndex + 1} / {charts.departmentTrends.length}
                                </span>
                                <button
                                    onClick={() => setCurrentTrendIndex(prev => prev < charts.departmentTrends.length - 1 ? prev + 1 : 0)}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                                >
                                    <ChevronRight className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={charts.departmentTrends?.[currentTrendIndex]?.trend || []} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 12 }}
                                    tickMargin={10}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(val) => {
                                        // Shorten displayed dates
                                        const parts = val.split('-');
                                        if (parts.length === 3) return `${parts[1]}/${parts[2]}`; // MM/DD
                                        if (parts.length === 2) return `${parts[1]}/${parts[0]}`; // MM/YYYY
                                        return val;
                                    }}
                                />
                                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any) => [`${value}`, 'Sessions']}
                                    labelFormatter={(label) => `Date: ${label}`}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    dot={{ r: 4, strokeWidth: 2 }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Department Distribution Pie Chart */}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                    <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <Users className="w-5 h-5 text-slate-400" />
                        Volume by Department
                    </h3>
                    <div className="h-72 w-full">
                        {charts.departmentDistribution.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={charts.departmentDistribution}
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {charts.departmentDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data available</div>
                        )}
                    </div>
                </div>

                {/* Top Issues Breakdown */}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 lg:col-span-2">
                    <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-slate-400" />
                        Top Issue Types
                    </h3>
                    {charts.topIssues && charts.topIssues.length > 0 ? (
                        <div className="space-y-3 overflow-y-auto" style={{ maxHeight: '288px' }}>
                            {(() => {
                                const max = charts.topIssues[0]?.value || 1;
                                return charts.topIssues.slice(0, 10).map((issue, index) => {
                                    const pct = Math.round((issue.value / max) * 100);
                                    const barColors = [
                                        'bg-blue-500', 'bg-emerald-500', 'bg-amber-500',
                                        'bg-violet-500', 'bg-rose-500', 'bg-cyan-500',
                                        'bg-orange-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500'
                                    ];
                                    const textColors = [
                                        'text-blue-600 dark:text-blue-400', 'text-emerald-600 dark:text-emerald-400',
                                        'text-amber-600 dark:text-amber-400', 'text-violet-600 dark:text-violet-400',
                                        'text-rose-600 dark:text-rose-400', 'text-cyan-600 dark:text-cyan-400',
                                        'text-orange-600 dark:text-orange-400', 'text-indigo-600 dark:text-indigo-400',
                                        'text-pink-600 dark:text-pink-400', 'text-teal-600 dark:text-teal-400'
                                    ];
                                    return (
                                        <div key={issue.name} className="flex items-center gap-3 group">
                                            <span className={`w-6 text-xs font-bold text-right flex-shrink-0 ${textColors[index % textColors.length]}`}>
                                                #{index + 1}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate pr-2">{issue.name}</span>
                                                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex-shrink-0">{issue.value.toLocaleString()}</span>
                                                </div>
                                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${barColors[index % barColors.length]}`}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    ) : (
                        <div className="h-72 flex items-center justify-center text-slate-400 text-sm">No data available</div>
                    )}
                </div>

            </div>

            {/* Secondary Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">

                {/* Emails Sent by Department Bar Chart */}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 lg:col-span-2">
                    <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-slate-400" />
                        Emails Sent by Department
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={charts.emailsSentByDept} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} tickMargin={10} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <RechartsTooltip cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Emails Sent" barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Chat Spikes by Time Chart */}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 lg:col-span-2">
                    <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-slate-400" />
                        Chat Spikes by Time of Day
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={charts.chatSpikes} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="hour" tick={{ fontSize: 12 }} tickMargin={10} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any) => [`${value}`, 'Sessions']}
                                    labelFormatter={(label) => `Hour: ${label}`}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#f59e0b"
                                    strokeWidth={3}
                                    dot={{ r: 4, strokeWidth: 2, fill: '#f59e0b' }}
                                    activeDot={{ r: 6, strokeWidth: 0, fill: '#f59e0b' }}
                                    name="Sessions"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Agents Bar Chart */}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                    <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <Users className="w-5 h-5 text-slate-400" />
                        Top 5 Agents by Volume
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={charts.topAgents.slice(0, 5)} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} width={100} />
                                <RechartsTooltip cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="chatsHandled" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Handled" barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Query Types Bar Chart */}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                    <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-slate-400" />
                        Most Common Issue Type
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={charts.topIssues.slice(0, 5)} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} tickMargin={10} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                <RechartsTooltip cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} name="Count" barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
