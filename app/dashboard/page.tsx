'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Clock, Users, FileText, CheckCircle2, AlertTriangle, MessageSquare, Loader2, RefreshCw, ChevronLeft, ChevronRight, Calendar, TrendingUp } from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import Combobox from '@/components/Combobox';

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
        topIssuesSegmented: { departmentName: string; data: { name: string; value: number }[] }[];
        topAgentsSegmented: { departmentName: string; data: { name: string; chatsHandled: number }[] }[];
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

    const [currentIssuesIndex, setCurrentIssuesIndex] = useState(0);
    const [currentAgentsIndex, setCurrentAgentsIndex] = useState(0);

    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);

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
                tzOffset: String(-new Date().getTimezoneOffset()), // minutes east of UTC
                ...(dateRange === 'allTime' && { allTime: 'true' })
            });

            const res = await fetch(`/api/analytics?${query.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch analytics data');

            const json = await res.json();
            setData(json);

            if (json.charts?.departmentTrends && !selectedDepartments.length) {
                // Initialize all departments to checked
                setSelectedDepartments(json.charts.departmentTrends.map((d: any) => d.departmentName));
            }
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
                <Loader2 className="w-10 h-10 animate-spin text-primary-600 mb-4" />
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

    const getDepartmentColor = (name: string, fallbackIndex: number) => {
        const lower = (name || '').toLowerCase();
        if (lower.includes('alston')) return '#eb2226';
        if (lower.includes('mysecondteacher')) return '#7a50ec';
        if (lower.includes('homeschool')) return '#55ca8f';
        return COLORS[fallbackIndex % COLORS.length];
    };

    const getComparativeTrendData = () => {
        if (!charts.departmentTrends || charts.departmentTrends.length === 0) return [];
        const dates = new Set<string>();
        charts.departmentTrends.forEach(dept => {
            dept.trend.forEach(t => dates.add(t.date));
        });
        const sortedDates = Array.from(dates).sort();
        return sortedDates.map(date => {
            const obj: any = { date };
            charts.departmentTrends.forEach(dept => {
                const match = dept.trend.find(t => t.date === date);
                obj[dept.departmentName] = match ? match.count : 0;
            });
            return obj;
        });
    };

    const comparativeData = getComparativeTrendData();

    const containerVariants: any = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants: any = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
    };

    const KpiCard = ({ title, value, icon: Icon, colorClass, subtitle, href }: any) => {
        const cardContent = (
            <motion.div
                variants={itemVariants}
                whileHover={{ y: -8, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 10 } }}
                whileTap={{ scale: 0.98 }}
                className={`group h-full glass-card rounded-2xl transition-all duration-500 p-6 flex items-start gap-4 shadow-antigravity hover:shadow-[0_20px_60px_rgba(0,0,0,0.6)] ${href ? 'cursor-pointer' : ''}`}
            >
                <div className={`p-4 rounded-xl shrink-0 ${colorClass} animate-bounce-subtle group-hover:scale-110 transition-transform duration-300 ${colorClass.includes('primary') ? 'glow-primary' : colorClass.includes('green') ? 'glow-success' : colorClass.includes('amber') ? 'glow-amber' : colorClass.includes('purple') ? 'glow-violet' : ''}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className="flex flex-col h-full">
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-bold mb-1 tracking-widest uppercase opacity-70">{title}</p>
                    <h3 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{value}</h3>
                    {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium italic opacity-60">{subtitle}</p>}
                </div>
            </motion.div>
        );
        return href ? <Link href={href} className="block h-full">{cardContent}</Link> : cardContent;
    };

    return (
        <div className="space-y-6 pb-12">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-primary-600" />
                        Performance Dashboard
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Overview of support chat volume and resolution metrics.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Link href="/dashboard/analytics" className="hidden md:flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium shadow-sm">
                        View Extensive Analytics
                    </Link>
                    {dateRange === 'custom' && (
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
                            <input
                                type="date"
                                value={customStart}
                                onChange={(e) => setCustomStart(e.target.value)}
                                className="flex-1 sm:w-auto px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-sm shadow-sm"
                            />
                            <span className="text-slate-500 dark:text-slate-400">to</span>
                            <input
                                type="date"
                                value={customEnd}
                                onChange={(e) => setCustomEnd(e.target.value)}
                                className="flex-1 sm:w-auto px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-sm shadow-sm"
                            />
                        </div>
                    )}
                    <div className="w-full xs:w-44">
                        <Combobox
                            options={[
                                { id: 'allTime', name: 'All Time' },
                                { id: '7days', name: 'Last 7 Days' },
                                { id: '30days', name: 'Last 30 Days' },
                                { id: 'thisYear', name: 'This Year' },
                                { id: 'custom', name: 'Custom Range' }
                            ]}
                            value={dateRange}
                            onChange={setDateRange}
                            searchable={false}
                        />
                    </div>

                    <button
                        onClick={fetchAnalytics}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm ml-auto sm:ml-0 cursor-pointer"
                        title="Refresh Dashboard"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <KpiCard
                    title="Total Chats"
                    value={summary.totalChats}
                    icon={MessageSquare}
                    colorClass="bg-primary-50 text-primary-600 dark:bg-primary-900/20"
                />
                <KpiCard
                    title="Resolution Rate"
                    value={`${summary.resolutionRate}%`}
                    icon={CheckCircle2}
                    colorClass="bg-green-50 text-green-600 dark:bg-green-900/20"
                    subtitle={`${summary.resolvedChats} resolved chats`}
                />
                <KpiCard
                    title="Total Emails Sent"
                    value={summary.totalEmailsSent}
                    icon={MessageSquare}
                    colorClass="bg-purple-50 text-purple-600 dark:bg-purple-900/20"
                />
                <KpiCard
                    title="Escalated / Open"
                    value={`${summary.escalatedChats} / ${summary.openChats}`}
                    icon={AlertTriangle}
                    colorClass="bg-red-50 text-red-600 dark:bg-red-900/20"
                    href="/dashboard/chat-logs?status=OpenEscalated"
                />
            </motion.div>

            {/* Main Charts Area */}
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Comparative Trend Chart (Full Width) */}
                <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 col-span-1 lg:col-span-3 hover:shadow-xl transition-all duration-300">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-slate-400" />
                            <h3 className="text-base md:text-lg font-semibold text-slate-800 dark:text-white">
                                Comparative Chat Volume Trend
                            </h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                            {charts.departmentTrends?.map((dept, index) => (
                                <label key={dept.departmentName} className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={selectedDepartments.includes(dept.departmentName)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedDepartments(prev => [...prev, dept.departmentName]);
                                            } else {
                                                setSelectedDepartments(prev => prev.filter(d => d !== dept.departmentName));
                                            }
                                        }}
                                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-primary-600 focus:ring-primary-500 bg-white dark:bg-slate-800 transition-colors"
                                    />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getDepartmentColor(dept.departmentName, index) }}></span>
                                        {dept.departmentName}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="h-[300px] md:h-[400px] w-full mt-4">
                        {comparativeData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={comparativeData} margin={{ top: 20, right: 30, left: -20, bottom: 40 }}>
                                    <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.03)" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 10, fill: 'var(--chart-tick)' }}
                                        tickMargin={12}
                                        axisLine={false}
                                        tickLine={false}
                                        interval={0}
                                        angle={-35}
                                        textAnchor="end"
                                        padding={{ right: 20 }}
                                        tickFormatter={(val) => {
                                            const parts = val.split('-');
                                            if (parts.length === 3) return `${parts[1]}/${parts[2]}`;
                                            if (parts.length === 2) return `${parts[1]}/${parts[0]}`;
                                            return val;
                                        }}
                                    />
                                    <YAxis tick={{ fontSize: 11, fill: 'var(--chart-tick)' }} axisLine={false} tickLine={false} />
                                    <RechartsTooltip
                                        contentStyle={{ 
                                            backgroundColor: 'rgba(255,255,255,0.02)', 
                                            backdropFilter: 'blur(12px)', 
                                            borderRadius: '16px', 
                                            border: '1px solid rgba(255,255,255,0.1)', 
                                            boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
                                            padding: '12px'
                                        }}
                                        labelFormatter={(label) => `Date: ${label}`}
                                        itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                                    />
                                    {charts.departmentTrends?.map((dept, index) => {
                                        if (!selectedDepartments.includes(dept.departmentName)) return null;
                                        const color = getDepartmentColor(dept.departmentName, index);
                                        return (
                                            <Line
                                                key={dept.departmentName}
                                                type="monotone"
                                                dataKey={dept.departmentName}
                                                name={dept.departmentName}
                                                stroke={color}
                                                strokeWidth={3}
                                                dot={false}
                                                activeDot={{ r: 5, strokeWidth: 0, fill: color }}
                                                style={{ filter: `drop-shadow(0 0 6px ${color})` }}
                                            />
                                        );
                                    })}
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data available</div>
                        )}
                    </div>
                </motion.div>

                {/* Department Distribution Pie Chart */}
                <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 hover:shadow-xl transition-all duration-300">
                    <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <Users className="w-5 h-5 text-slate-400" />
                        Volume by Department
                    </h3>
                    <div className="h-64 md:h-72 w-full">
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
                                            <Cell key={`cell-${index}`} fill={getDepartmentColor(entry.name, index)} />
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
                </motion.div>

                {/* Top Issues Breakdown */}
                <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 lg:col-span-2 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-slate-400" />
                            <h3 className="text-base font-semibold text-slate-800 dark:text-white">
                                Top Issue Types ({charts.topIssuesSegmented?.[currentIssuesIndex]?.departmentName || 'Loading'})
                            </h3>
                        </div>
                        {charts.topIssuesSegmented && charts.topIssuesSegmented.length > 1 && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentIssuesIndex(prev => prev > 0 ? prev - 1 : charts.topIssuesSegmented.length - 1)}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                                >
                                    <ChevronLeft className="w-5 h-5 text-slate-500" />
                                </button>
                                <span className="text-sm font-medium text-slate-500">
                                    {currentIssuesIndex + 1} / {charts.topIssuesSegmented.length}
                                </span>
                                <button
                                    onClick={() => setCurrentIssuesIndex(prev => prev < charts.topIssuesSegmented.length - 1 ? prev + 1 : 0)}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                                >
                                    <ChevronRight className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>
                        )}
                    </div>
                    {charts.topIssuesSegmented?.[currentIssuesIndex]?.data && charts.topIssuesSegmented[currentIssuesIndex].data.length > 0 ? (
                        <div className="space-y-3 overflow-y-auto" style={{ maxHeight: '288px' }}>
                            {(() => {
                                const issuesData = charts.topIssuesSegmented[currentIssuesIndex].data;
                                const max = issuesData[0]?.value || 1;
                                return issuesData.slice(0, 10).map((issue, index) => {
                                    const pct = Math.round((issue.value / max) * 100);
                                    const barColors = [
                                        'bg-primary-500', 'bg-emerald-500', 'bg-amber-500',
                                        'bg-violet-500', 'bg-rose-500', 'bg-cyan-500',
                                        'bg-orange-500', 'bg-primary-500', 'bg-pink-500', 'bg-teal-500'
                                    ];
                                    const textColors = [
                                        'text-primary-600 dark:text-primary-400', 'text-emerald-600 dark:text-emerald-400',
                                        'text-amber-600 dark:text-amber-400', 'text-violet-600 dark:text-violet-400',
                                        'text-rose-600 dark:text-rose-400', 'text-cyan-600 dark:text-cyan-400',
                                        'text-orange-600 dark:text-orange-400', 'text-primary-600 dark:text-primary-400',
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
                                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(255,255,255,0.2)] ${barColors[index % barColors.length]}`}
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
                </motion.div>

            </motion.div>

            {/* Secondary Charts */}
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">

                {/* Emails Sent by Department Bar Chart */}
                <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 lg:col-span-2 hover:shadow-xl transition-all duration-300">
                    <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-slate-400" />
                        Emails Sent by Department
                    </h3>
                    <div className="h-48 md:h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={charts.emailsSentByDept} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--chart-tick)' }} tickMargin={10} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 12, fill: 'var(--chart-tick)' }} axisLine={false} tickLine={false} />
                                <RechartsTooltip cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Emails Sent" barSize={40}>
                                    {charts.emailsSentByDept.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getDepartmentColor(entry.name, index)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Chat Spikes by Time Chart */}
                <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 lg:col-span-2 hover:shadow-xl transition-all duration-300">
                    <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-slate-400" />
                        Chat Spikes by Time of Day
                    </h3>
                    <div className="h-48 md:h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={charts.chatSpikes} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis 
                                    dataKey="hour" 
                                    tick={{ fontSize: 10 }} 
                                    tickMargin={10} 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tickFormatter={(hour) => {
                                        const h = parseInt(hour, 10);
                                        const ampm = h >= 12 ? 'PM' : 'AM';
                                        const h12 = h % 12 || 12;
                                        return `${h12}${ampm}`;
                                    }}
                                />
                                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any) => [`${value}`, 'Sessions']}
                                    labelFormatter={(label) => {
                                        const h = parseInt(label, 10);
                                        const ampm = h >= 12 ? 'PM' : 'AM';
                                        const h12 = h % 12 || 12;
                                        return `Time: ${h12}:00 ${ampm}`;
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#f59e0b"
                                    strokeWidth={4}
                                    dot={false}
                                    activeDot={{ r: 6, strokeWidth: 0, fill: '#f59e0b' }}
                                    name="Sessions"
                                    style={{ filter: `drop-shadow(0 0 10px #f59e0b)` }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Top Agents Bar Chart */}
                <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-slate-400" />
                            <h3 className="text-base font-semibold text-slate-800 dark:text-white">
                                Top 5 Agents ({charts.topAgentsSegmented?.[currentAgentsIndex]?.departmentName || 'Loading'})
                            </h3>
                        </div>
                        {charts.topAgentsSegmented && charts.topAgentsSegmented.length > 1 && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentAgentsIndex(prev => prev > 0 ? prev - 1 : charts.topAgentsSegmented.length - 1)}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                                >
                                    <ChevronLeft className="w-5 h-5 text-slate-500" />
                                </button>
                                <span className="text-sm font-medium text-slate-500">
                                    {currentAgentsIndex + 1} / {charts.topAgentsSegmented.length}
                                </span>
                                <button
                                    onClick={() => setCurrentAgentsIndex(prev => prev < charts.topAgentsSegmented.length - 1 ? prev + 1 : 0)}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                                >
                                    <ChevronRight className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={charts.topAgentsSegmented?.[currentAgentsIndex]?.data?.slice(0, 5) || []} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                <XAxis type="number" tick={{ fontSize: 12, fill: 'var(--chart-tick)' }} axisLine={false} tickLine={false} />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: 'var(--chart-tick)' }} axisLine={false} tickLine={false} width={100} />
                                <RechartsTooltip cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="chatsHandled" radius={[0, 4, 4, 0]} name="Handled" barSize={24}>
                                    {(charts.topAgentsSegmented?.[currentAgentsIndex]?.data?.slice(0, 5) || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getDepartmentColor(charts.topAgentsSegmented?.[currentAgentsIndex]?.departmentName || '', index)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Top Query Types Bar Chart */}
                <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-slate-400" />
                            <h3 className="text-base font-semibold text-slate-800 dark:text-white">
                                Most Common Issue Type ({charts.topIssuesSegmented?.[currentIssuesIndex]?.departmentName || 'Loading'})
                            </h3>
                        </div>
                        {charts.topIssuesSegmented && charts.topIssuesSegmented.length > 1 && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentIssuesIndex(prev => prev > 0 ? prev - 1 : charts.topIssuesSegmented.length - 1)}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                                >
                                    <ChevronLeft className="w-5 h-5 text-slate-500" />
                                </button>
                                <span className="text-sm font-medium text-slate-500">
                                    {currentIssuesIndex + 1} / {charts.topIssuesSegmented.length}
                                </span>
                                <button
                                    onClick={() => setCurrentIssuesIndex(prev => prev < charts.topIssuesSegmented.length - 1 ? prev + 1 : 0)}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                                >
                                    <ChevronRight className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={(charts.topIssuesSegmented?.[currentIssuesIndex]?.data || []).slice(0, 5)} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} tickMargin={10} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                <RechartsTooltip cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} name="Count" barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
