'use client';

import { useState, useEffect } from 'react';
import { PieChart, Clock, Users, FileText, CheckCircle2, AlertTriangle, MessageSquare, Loader2, RefreshCw, ChevronLeft, Building2 } from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, PieChart as RechartsPieChart, Pie, Cell
} from 'recharts';
import Link from 'next/link';

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
        chatsByCountry: { name: string; value: number }[];
        chatsByRole: { name: string; value: number }[];
    };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [dateRange, setDateRange] = useState('allTime');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const today = new Date();
            let startDate = new Date();
            let finalEndDate = today;

            if (dateRange === 'custom') {
                if (!customStart || !customEnd) {
                    setLoading(false);
                    return;
                }
                startDate = new Date(customStart);
                finalEndDate = new Date(customEnd);
                finalEndDate.setHours(23, 59, 59, 999);
            } else {
                switch (dateRange) {
                    case '7days': startDate.setDate(today.getDate() - 7); break;
                    case '30days': startDate.setDate(today.getDate() - 30); break;
                    case 'thisYear':
                        startDate.setFullYear(today.getFullYear(), 0, 1);
                        finalEndDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
                        break;
                    case 'allTime': break;
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
                <Loader2 className="w-10 h-10 animate-spin text-primary-600 mb-4" />
                <p className="font-medium">Compiling Extensive Analytics...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="p-6 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/50 flex items-center justify-center h-64">
                <div className="text-center">
                    <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-red-500" />
                    <p className="font-medium text-lg">Error loading analytics</p>
                    <p className="text-sm mt-1">{error}</p>
                    <button onClick={fetchAnalytics} className="mt-4 px-4 py-2 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/40 text-sm font-medium transition-colors">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const { charts } = data;

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/dashboard" className="text-sm text-slate-500 hover:text-primary-600 flex items-center transition-colors font-medium">
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Back to Dashboard
                        </Link>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <PieChart className="w-6 h-6 text-primary-600" />
                        Extensive Analytics View
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Deep dive into support metrics and detailed records.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {dateRange === 'custom' && (
                        <div className="flex flex-wrap md:flex-nowrap items-center gap-2">
                            <input
                                type="date"
                                value={customStart}
                                onChange={(e) => setCustomStart(e.target.value)}
                                className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-sm shadow-sm"
                            />
                            <span className="text-slate-500 dark:text-slate-400">to</span>
                            <input
                                type="date"
                                value={customEnd}
                                onChange={(e) => setCustomEnd(e.target.value)}
                                className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-sm shadow-sm"
                            />
                        </div>
                    )}
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors sm:text-sm font-medium shadow-sm"
                    >
                        <option value="allTime">All Time</option>
                        <option value="7days">Last 7 Days</option>
                        <option value="30days">Last 30 Days</option>
                        <option value="thisYear">This Year</option>
                        <option value="custom">Custom Range</option>
                    </select>

                    <button
                        onClick={fetchAnalytics}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm"
                        title="Refresh Analytics"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
                {/* Volume By Country Pie Chart */}
                <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-sm border border-white/20 dark:border-slate-800/50 hover:shadow-md transition-all duration-300 col-span-1 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-slate-400" />
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Chats by Country</h3>
                    </div>
                    <div className="h-80 p-6">
                        {charts.chatsByCountry && charts.chatsByCountry.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsPieChart>
                                    <Pie
                                        data={charts.chatsByCountry}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {charts.chatsByCountry.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        formatter={(value: any) => [`${value} chats`, 'Volume']}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend />
                                </RechartsPieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-500">
                                No country data found for this period.
                            </div>
                        )}
                    </div>
                </div>

                {/* Volume By Role Pie Chart */}
                <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-sm border border-white/20 dark:border-slate-800/50 hover:shadow-md transition-all duration-300 col-span-1 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                        <Users className="w-5 h-5 text-slate-400" />
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Chat Volume by Role</h3>
                    </div>
                    <div className="h-80 p-6">
                        {charts.chatsByRole && charts.chatsByRole.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsPieChart>
                                    <Pie
                                        data={charts.chatsByRole}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {charts.chatsByRole.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        formatter={(value: any) => [`${value} chats`, 'Volume']}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend />
                                </RechartsPieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-500">
                                No role data found for this period.
                            </div>
                        )}
                    </div>
                </div>

                {/* Volume By Department Full List */}
                <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-sm border border-white/20 dark:border-slate-800/50 hover:shadow-md transition-all duration-300 overflow-hidden col-span-1 lg:col-span-2">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-slate-400" />
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Department Overview</h3>
                    </div>
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 font-medium border-b border-slate-200 dark:border-slate-700 sticky top-0">
                                <tr>
                                    <th className="px-6 py-4">Department</th>
                                    <th className="px-6 py-4 text-right">Volume</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {charts.departmentDistribution.length > 0 ? (
                                    charts.departmentDistribution.map((item, index) => (
                                        <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-3 font-medium">{item.name}</td>
                                            <td className="px-6 py-3 text-right font-semibold">{item.value}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={2} className="px-6 py-8 text-center text-slate-500">No department data found for this period.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Extensive Emails Sent By Department Table */}
                <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-sm border border-white/20 dark:border-slate-800/50 hover:shadow-md transition-all duration-300 overflow-hidden col-span-1 lg:col-span-2">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-slate-400" />
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Emails Sent By Department</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 font-medium border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="px-6 py-4">Department</th>
                                    <th className="px-6 py-4 text-right">Emails Sent</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {charts.emailsSentByDept && charts.emailsSentByDept.length > 0 ? (
                                    charts.emailsSentByDept.map((item, index) => (
                                        <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-3 font-medium">{item.name}</td>
                                            <td className="px-6 py-3 text-right font-semibold">{item.value}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={2} className="px-6 py-8 text-center text-slate-500">No emails sent data found for this period.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Extensive Agent Performance Table */}
                <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-sm border border-white/20 dark:border-slate-800/50 hover:shadow-md transition-all duration-300 overflow-hidden col-span-1 lg:col-span-2">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                        <Users className="w-5 h-5 text-slate-400" />
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Full Agent Performance</h3>
                    </div>
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 font-medium border-b border-slate-200 dark:border-slate-700 sticky top-0">
                                <tr>
                                    <th className="px-6 py-4">Rank</th>
                                    <th className="px-6 py-4">Agent Name</th>
                                    <th className="px-6 py-4 text-right">Chats Handled</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {(() => {
                                    const allAgentsData = charts.topAgentsSegmented?.find(d => d.departmentName === 'All Departments')?.data || [];
                                    return allAgentsData.length > 0 ? (
                                        allAgentsData.map((item, index) => (
                                            <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-3 font-medium text-slate-500">#{index + 1}</td>
                                                <td className="px-6 py-3">{item.name}</td>
                                                <td className="px-6 py-3 text-right font-semibold">{item.chatsHandled}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-8 text-center text-slate-500">No agent data found for this period.</td>
                                        </tr>
                                    );
                                })()}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Extensive Issue Types Table */}
                <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-sm border border-white/20 dark:border-slate-800/50 hover:shadow-md transition-all duration-300 overflow-hidden col-span-1 lg:col-span-2">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-slate-400" />
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">All Issue Types Ranking</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 font-medium border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="px-6 py-4">Rank</th>
                                    <th className="px-6 py-4">Issue Type</th>
                                    <th className="px-6 py-4 text-right">Count</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {(() => {
                                    const allIssuesData = charts.topIssuesSegmented?.find(d => d.departmentName === 'All Departments')?.data || [];
                                    return allIssuesData.length > 0 ? (
                                        allIssuesData.map((item, index) => (
                                            <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-3 font-medium text-slate-500">#{index + 1}</td>
                                                <td className="px-6 py-3">{item.name}</td>
                                                <td className="px-6 py-3 text-right font-semibold">{item.value}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-8 text-center text-slate-500">No issue type data found for this period.</td>
                                        </tr>
                                    );
                                })()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
