'use client';

import { useState, useEffect } from 'react';
import { Search, MessageSquare, Loader2, RefreshCw, FileText, Trash2, X, Edit2, Save, XCircle, Download, Filter } from 'lucide-react';
import Link from 'next/link';
import ConfirmDialog from '@/components/ConfirmDialog';

interface ChatSession {
    id: string;
    chatCode: string;
    queryDescription: string;
    status: 'Open' | 'Resolved' | 'Escalated';
    feedback: 'Happy' | 'Neutral' | 'Sad' | null;
    createdAt: string;
    closedAt?: string;
    emailSent: boolean;
    resolution?: string | null;
    customer: { fullName: string; email: string; school?: string | null; contactNumber?: string | null; country?: string | null; role?: string | null };
    department: { name: string };
    agent: { name: string };
    queryType: { name: string };
    issueType: { name: string };
}

export default function ChatLogsPage() {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Pagination & Search
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const status = params.get('status');
            if (status) {
                setStatusFilter(status);
            }
        }
    }, []);
    const [departmentFilter, setDepartmentFilter] = useState('All');
    const [isExporting, setIsExporting] = useState(false);

    // Form Metadata Dropdowns
    const [departments, setDepartments] = useState<{ id: string, name: string }[]>([]);
    const [agents, setAgents] = useState<{ id: string, name: string }[]>([]);
    const [queryTypes, setQueryTypes] = useState<{ id: string, name: string }[]>([]);
    const [issueTypes, setIssueTypes] = useState<{ id: string, name: string }[]>([]);

    // Modal & Edit State
    const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editForm, setEditForm] = useState({
        resolution: '',
        emailSent: false,
        agentId: '',
        departmentId: '',
        queryTypeId: '',
        issueTypeId: '',
        queryDescription: '',
        feedback: '' as 'Happy' | 'Neutral' | 'Sad' | ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [success, setSuccess] = useState('');

    // Bulk Delete State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isDeletingBulk, setIsDeletingBulk] = useState(false);
    const [isDeletingAll, setIsDeletingAll] = useState(false);

    // Confirm Dialog State
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState('');
    const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);

    // Fetch master dropdowns
    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const [deptRes, agentRes, queryRes, issueRes] = await Promise.all([
                    fetch('/api/departments'),
                    fetch('/api/agents'),
                    fetch('/api/query-types'),
                    fetch('/api/issue-types')
                ]);
                if (deptRes.ok) setDepartments(await deptRes.json());
                if (agentRes.ok) setAgents(await agentRes.json());
                if (queryRes.ok) setQueryTypes(await queryRes.json());
                if (issueRes.ok) setIssueTypes(await issueRes.json());
            } catch (err) {
                console.error("Failed to load dropdown mappings", err);
            }
        };
        fetchMasterData();
    }, []);

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset to page 1 on search
        }, 500);
        return () => clearTimeout(handler);
    }, [search]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page: page.toString(),
                limit: '15',
                search: debouncedSearch,
                status: statusFilter,
                departmentId: departmentFilter,
                _t: Date.now().toString()
            });

            const res = await fetch(`/api/chat-sessions?${query.toString()}`, {
                cache: 'no-store',
                headers: {
                    'Pragma': 'no-cache',
                    'Cache-Control': 'no-cache'
                }
            });
            if (!res.ok) throw new Error('Failed to fetch chat logs');

            const data = await res.json();
            setSessions(data.data);
            setTotalPages(data.pagination.totalPages);
            setTotalRecords(data.pagination.total);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, debouncedSearch, statusFilter, departmentFilter]);

    const handleExportCSV = async () => {
        setIsExporting(true);
        try {
            const query = new URLSearchParams({
                search: debouncedSearch,
                status: statusFilter,
                departmentId: departmentFilter,
                export: 'true'
            });

            const res = await fetch(`/api/chat-sessions?${query.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch export data');
            const { data } = await res.json();

            const headers = ['Chat Code', 'Date', 'Customer Name', 'Customer Email', 'Agent', 'Department', 'Query Type', 'Issue Type', 'Status', 'Description', 'Resolution'];
            const rows = data.map((s: any) => [
                s.chatCode,
                new Date(s.createdAt).toLocaleString().replace(',', ''),
                `"${(s.customer?.fullName || '').replace(/"/g, '""')}"`,
                s.customer?.email || '',
                `"${s.agent?.name || ''}"`,
                `"${s.department?.name || ''}"`,
                `"${s.queryType?.name || ''}"`,
                `"${s.issueType?.name || ''}"`,
                s.status,
                `"${(s.queryDescription || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
                `"${(s.resolution || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
            ]);

            const csvContent = [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `support_logs_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsExporting(false);
        }
    };

    const handleDelete = (id: string, code: string) => {
        setConfirmMessage(`Are you sure you want to delete chat session ${code}? This action cannot be undone.`);
        setPendingAction(() => async () => {
            const previousSessions = [...sessions];
            setSessions(prev => prev.filter(s => s.id !== id));
            setSelectedIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
            try {
                const res = await fetch(`/api/chat-sessions?id=${id}`, { method: 'DELETE' });
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || 'Failed to delete chat session');
                }
                await fetchLogs();
            } catch (err: any) {
                setSessions(previousSessions);
                setError(err.message);
            }
        });
        setConfirmOpen(true);
    };

    const handleDeleteAll = () => {
        setConfirmMessage(`Are you sure you want to DELETE ALL ${totalRecords} chat sessions? This will wipe the entire database and cannot be undone.`);
        setPendingAction(() => async () => {
            setIsDeletingAll(true);
            try {
                const res = await fetch('/api/chat-sessions?all=true', { method: 'DELETE' });
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || 'Failed to delete all chat sessions');
                }
                setSelectedIds(new Set());
                await fetchLogs();
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsDeletingAll(false);
            }
        });
        setConfirmOpen(true);
    };

    const handleBulkDelete = () => {
        if (selectedIds.size === 0) return;
        setConfirmMessage(`Are you sure you want to delete ${selectedIds.size} chat session${selectedIds.size > 1 ? 's' : ''}? This action cannot be undone.`);
        setPendingAction(() => async () => {
            setIsDeletingBulk(true);
            try {
                const res = await fetch(`/api/chat-sessions`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: Array.from(selectedIds) })
                });
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || 'Failed to bulk delete chat sessions');
                }
                setSelectedIds(new Set());
                await fetchLogs();
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsDeletingBulk(false);
            }
        });
        setConfirmOpen(true);
    };

    const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            // Select all visible sessions
            const currentIds = sessions.map(s => s.id);
            setSelectedIds(new Set([...selectedIds, ...currentIds]));
        } else {
            // Deselect visible sessions
            const newSet = new Set(selectedIds);
            sessions.forEach(s => newSet.delete(s.id));
            setSelectedIds(newSet);
        }
    };

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleSaveEdit = async () => {
        if (!selectedSession) return;
        setIsSaving(true);
        setSuccess('');

        try {
            const res = await fetch(`/api/chat-sessions`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedSession.id,
                    ...editForm
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update chat session');
            }

            const refreshedData = await res.json();

            // Update local state to reflect changes immediately including the joined records from backend
            const updatedSession: ChatSession = {
                ...selectedSession,
                ...editForm,
                feedback: editForm.feedback === '' ? null : editForm.feedback,
                agent: refreshedData.agent || selectedSession.agent,
                department: refreshedData.department || selectedSession.department,
                queryType: refreshedData.queryType || selectedSession.queryType,
                issueType: refreshedData.issueType || selectedSession.issueType,
                status: editForm.resolution ? 'Resolved' as const : selectedSession.status
            };

            setSelectedSession(updatedSession);
            setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
            setIsEditMode(false);
            setSuccess('Chat log successfully updated.');
            setTimeout(() => setSuccess(''), 4000);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const openModal = (session: ChatSession) => {
        setSelectedSession(session);
        setIsEditMode(false);
        setSuccess('');

        // Find existing IDs from master data lists to map string names back to Database IDs
        const qAgent = agents.find(a => a.name === session.agent.name)?.id || '';
        const qDept = departments.find(d => d.name === session.department.name)?.id || '';
        const qQType = queryTypes.find(q => q.name === session.queryType.name)?.id || '';
        const qIType = issueTypes.find(i => i.name === session.issueType.name)?.id || '';

        setEditForm({
            resolution: session.resolution || '',
            emailSent: session.emailSent || false,
            agentId: qAgent,
            departmentId: qDept,
            queryTypeId: qQType,
            issueTypeId: qIType,
            queryDescription: session.queryDescription || '',
            feedback: session.feedback || ''
        });
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const colors = {
            Open: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            Resolved: 'bg-green-100 text-green-800 border-green-200',
            Escalated: 'bg-red-100 text-red-800 border-red-200',
        };
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[status as keyof typeof colors] || colors.Open}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="space-y-4 flex flex-col h-[calc(100vh-8rem)]">
            {/* Header: Title left, all controls right in one bar */}
            <div className="flex items-center justify-between gap-4 shrink-0">
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2 truncate">
                        <MessageSquare className="w-6 h-6 text-primary-600 shrink-0" />
                        Chat Logs
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {totalRecords > 0 ? <><span className="font-semibold text-slate-700 dark:text-slate-200">{totalRecords.toLocaleString()}</span> recorded interactions</> : 'Browse and search all support interactions.'}
                    </p>
                </div>

                {/* Controls row */}
                <div className="flex items-center gap-2 shrink-0">
                    {/* Status filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        className="h-9 px-3 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                    >
                        <option value="All">All Statuses</option>
                        <option value="Open">Open</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Escalated">Escalated</option>
                        <option value="OpenEscalated">Escalated &amp; Open</option>
                    </select>

                    {/* Department filter */}
                    <select
                        value={departmentFilter}
                        onChange={(e) => { setDepartmentFilter(e.target.value); setPage(1); }}
                        className="h-9 px-3 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                    >
                        <option value="All">All Departments</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>

                    {/* Search */}
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8 pr-3 h-9 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm w-44"
                        />
                    </div>

                    {/* Divider */}
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />

                    {/* Export */}
                    <button
                        onClick={handleExportCSV}
                        disabled={isExporting || totalRecords === 0}
                        className="h-9 px-3 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        title="Export to CSV"
                    >
                        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Export
                    </button>

                    {/* Refresh */}
                    <button
                        onClick={fetchLogs}
                        className="h-9 w-9 flex items-center justify-center text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>

                    {/* Delete All */}
                    <button
                        onClick={handleDeleteAll}
                        disabled={isDeletingAll || totalRecords === 0}
                        className="h-9 px-3 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        title="Delete All Chat Sessions"
                    >
                        {isDeletingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        Delete All
                    </button>
                </div>
            </div>

            {selectedIds.size > 0 && (
                <div className="bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 rounded-lg p-3 flex items-center justify-between shrink-0 animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center gap-3">
                        <span className="bg-primary-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {selectedIds.size}
                        </span>
                        <span className="text-sm font-medium text-primary-900 dark:text-primary-200">sessions selected</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSelectedIds(new Set())}
                            className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleBulkDelete}
                            disabled={isDeletingBulk}
                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isDeletingBulk ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            Delete Selected
                        </button>
                    </div>
                </div>
            )
            }

            < div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-sm border border-white/20 dark:border-slate-800/50 hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col flex-1" >
                {loading && sessions.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="ml-3 font-medium">Loading chat logs...</span>
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center h-full px-4 p-8">
                        <FileText className="w-12 h-12 text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No Chat Logs Found</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm">
                            {search ? "No records match your search query." : "There are no recorded chat sessions yet."}
                        </p>
                        {!search && (
                            <Link
                                href="/dashboard/add-entry"
                                className="mt-6 text-primary-600 hover:text-primary-700 font-medium text-sm hover:underline"
                            >
                                + Create your first entry
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-6 py-4 font-medium w-12 text-center">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500 cursor-pointer"
                                            checked={sessions.length > 0 && sessions.every(s => selectedIds.has(s.id))}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th className="px-6 py-4 font-medium min-w-[140px]">Date / Code</th>
                                    <th className="px-6 py-4 font-medium min-w-[200px]">Customer</th>
                                    <th className="px-6 py-4 font-medium min-w-[250px]">Handling Info</th>
                                    <th className="px-6 py-4 font-medium min-w-[300px]">Query Details</th>
                                    <th className="px-6 py-4 font-medium text-center">Status</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {sessions.map((session) => (
                                    <tr key={session.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors align-top ${selectedIds.has(session.id) ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''}`}>
                                        <td className="px-6 py-4 text-center">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500 cursor-pointer"
                                                checked={selectedIds.has(session.id)}
                                                onChange={() => toggleSelect(session.id)}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-900 dark:text-white">{session.chatCode}</div>
                                            <div className="text-xs text-slate-500 mt-1 whitespace-nowrap">
                                                {new Date(session.createdAt).toLocaleDateString('en-US')}
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                {new Date(session.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900 dark:text-white line-clamp-1" title={session.customer.fullName}>
                                                {session.customer.fullName}
                                                {session.customer.role && (
                                                    <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                                        {session.customer.role}
                                                    </span>
                                                )}
                                            </div>
                                            {session.customer.email && (
                                                <div className="text-xs text-slate-500 mt-1 line-clamp-1" title={session.customer.email}>
                                                    {session.customer.email}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-slate-800 dark:text-slate-300 text-sm"><span className="text-slate-500 dark:text-slate-400">Agt:</span> {session.agent.name}</div>
                                            <div className="text-xs text-slate-500 mt-1"><span className="text-slate-400">Dept:</span> {session.department.name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                <span className="text-[10px] font-semibold bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                    {session.queryType.name}
                                                </span>
                                                <span className="text-[10px] font-semibold bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                    {session.issueType.name}
                                                </span>
                                            </div>
                                            <p className="text-slate-600 dark:text-slate-300 line-clamp-2 text-sm" title={session.queryDescription}>
                                                {session.queryDescription}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <StatusBadge status={session.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => openModal(session)}
                                                    className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(session.id, session.chatCode)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                    title="Delete Chat Session"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
                }

                {/* Pagination Footer */}
                {
                    sessions.length > 0 && (
                        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between shrink-0">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Showing <span className="font-medium text-slate-700 dark:text-slate-300">{(page - 1) * 15 + 1}</span> to <span className="font-medium text-slate-700 dark:text-slate-300">{Math.min(page * 15, totalRecords)}</span> of <span className="font-medium text-slate-700 dark:text-slate-300">{totalRecords}</span> results
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-3 py-1 border border-slate-300 dark:border-slate-700 rounded text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 disabled:opacity-50 transition-colors"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-3 py-1 border border-slate-300 dark:border-slate-700 rounded text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 disabled:opacity-50 transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )
                }
            </div >

            {/* Chat Session Details Modal */}
            {
                selectedSession && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                            {/* Modal Header */}
                            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 border-b dark:bg-slate-800/50">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                        {selectedSession.chatCode}
                                    </h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3">
                                        <span>{new Date(selectedSession.createdAt).toLocaleString('en-US')}</span>
                                        <StatusBadge status={selectedSession.status} />
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!isEditMode ? (
                                        <button
                                            onClick={() => setIsEditMode(true)}
                                            className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                                            title="Edit Details"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setIsEditMode(false)}
                                            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors font-medium text-sm flex items-center gap-1"
                                        >
                                            <XCircle className="w-4 h-4" /> Cancel
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setSelectedSession(null)}
                                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                        title="Close"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Notifications */}
                            {success && (
                                <div className="px-6 py-3 bg-green-50 text-green-700 border-b border-green-100 flex items-center justify-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                                    <FileText className="w-4 h-4" />
                                    {success}
                                </div>
                            )}
                            {error && (
                                <div className="px-6 py-3 bg-red-50 text-red-700 border-b border-red-100 flex items-center justify-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                                    <XCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}

                            {/* Modal Body */}
                            <div className="p-6 overflow-y-auto flex-1 space-y-6">
                                {/* Customer Details */}
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">Customer Details</h3>
                                    <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700/50">
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Name</p>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedSession.customer.fullName}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Email</p>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedSession.customer.email || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">School / Organization</p>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedSession.customer.school || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Contact Number</p>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedSession.customer.contactNumber || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Country</p>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedSession.customer.country || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Role</p>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedSession.customer.role || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Handling Info */}
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">Handling Info</h3>
                                    <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700/50">
                                        {/* Agent */}
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Agent</p>
                                            {isEditMode ? (
                                                <select
                                                    value={editForm.agentId}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, agentId: e.target.value }))}
                                                    className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-sm"
                                                >
                                                    <option value="" disabled>Select Agent</option>
                                                    {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                                </select>
                                            ) : (
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedSession.agent.name}</p>
                                            )}
                                        </div>

                                        {/* Department */}
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Department</p>
                                            {isEditMode ? (
                                                <select
                                                    value={editForm.departmentId}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, departmentId: e.target.value }))}
                                                    className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-sm"
                                                >
                                                    <option value="" disabled>Select Department</option>
                                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                                </select>
                                            ) : (
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedSession.department.name}</p>
                                            )}
                                        </div>

                                        {/* Query Type */}
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Query Type</p>
                                            {isEditMode ? (
                                                <select
                                                    value={editForm.queryTypeId}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, queryTypeId: e.target.value }))}
                                                    className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-sm"
                                                >
                                                    <option value="" disabled>Select Query Type</option>
                                                    {queryTypes.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
                                                </select>
                                            ) : (
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedSession.queryType.name}</p>
                                            )}
                                        </div>

                                        {/* Issue Type */}
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Issue Type</p>
                                            {isEditMode ? (
                                                <select
                                                    value={editForm.issueTypeId}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, issueTypeId: e.target.value }))}
                                                    className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-sm"
                                                >
                                                    <option value="" disabled>Select Issue Type</option>
                                                    {issueTypes.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                                </select>
                                            ) : (
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedSession.issueType.name}</p>
                                            )}
                                        </div>

                                        {/* Feedback Rating */}
                                        <div className="col-span-2 md:col-span-1">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Customer Feedback</p>
                                            {isEditMode ? (
                                                <select
                                                    value={editForm.feedback}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, feedback: e.target.value as 'Happy' | 'Neutral' | 'Sad' | '' }))}
                                                    className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-sm"
                                                >
                                                    <option value="">N/A</option>
                                                    <option value="Happy">😃 Happy</option>
                                                    <option value="Neutral">😐 Neutral</option>
                                                    <option value="Sad">☹️ Sad</option>
                                                </select>
                                            ) : (
                                                <div className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                                                    {selectedSession.feedback === 'Happy' && <><span className="text-lg">😃</span> Happy</>}
                                                    {selectedSession.feedback === 'Neutral' && <><span className="text-lg">😐</span> Neutral</>}
                                                    {selectedSession.feedback === 'Sad' && <><span className="text-lg">☹️</span> Sad</>}
                                                    {!selectedSession.feedback && <span className="text-slate-400 font-normal italic">N/A</span>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Query Description */}
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">Query Description</h3>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700/50">
                                        {isEditMode ? (
                                            <textarea
                                                value={editForm.queryDescription}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, queryDescription: e.target.value }))}
                                                placeholder="What was the initial question or problem?"
                                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 transition-colors text-sm min-h-[80px]"
                                            />
                                        ) : (
                                            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{selectedSession.queryDescription}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Resolution & Email Sent (Editable) */}
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">Resolution Details</h3>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700/50 space-y-4">

                                        <div>
                                            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">Replied via Email?</p>
                                            {isEditMode ? (
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={editForm.emailSent}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, emailSent: e.target.checked }))}
                                                    />
                                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary-600"></div>
                                                    <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">{editForm.emailSent ? 'Yes' : 'No'}</span>
                                                </label>
                                            ) : (
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedSession.emailSent ? 'Yes' : 'No'}</p>
                                            )}
                                        </div>

                                        <div>
                                            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">Resolution Provided</p>
                                            {isEditMode ? (
                                                <textarea
                                                    value={editForm.resolution}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, resolution: e.target.value }))}
                                                    placeholder="Enter the resolution details..."
                                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 transition-colors text-sm min-h-[100px]"
                                                />
                                            ) : (
                                                <div className="bg-white dark:bg-slate-900 p-3 rounded border border-slate-200 dark:border-slate-700">
                                                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                                        {selectedSession.resolution || <span className="text-slate-400 italic">No resolution provided.</span>}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            {isEditMode && (
                                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                                    <button
                                        onClick={() => setIsEditMode(false)}
                                        className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveEdit}
                                        disabled={isSaving}
                                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Save Changes
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            <ConfirmDialog
                isOpen={confirmOpen}
                title="Confirm Deletion"
                message={confirmMessage}
                confirmLabel="Delete"
                variant="danger"
                onConfirm={async () => {
                    setConfirmOpen(false);
                    if (pendingAction) await pendingAction();
                    setPendingAction(null);
                }}
                onCancel={() => {
                    setConfirmOpen(false);
                    setPendingAction(null);
                }}
            />
        </div >
    );
}
