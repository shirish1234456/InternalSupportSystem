'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';

interface IssueType {
    id: string;
    name: string;
    createdAt: string;
    _count: {
        sessions: number;
    };
}

export default function IssueTypesPage() {
    const [types, setTypes] = useState<IssueType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingType, setEditingType] = useState<IssueType | null>(null);
    const [typeName, setTypeName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState('');
    const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isDeletingBulk, setIsDeletingBulk] = useState(false);

    const fetchTypes = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/issue-types');
            if (!res.ok) throw new Error('Failed to fetch issue types');
            const data = await res.json();
            setTypes(data);
        } catch (err) {
            setError('Could not load issue types.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTypes();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const method = editingType ? 'PUT' : 'POST';
            const body = editingType
                ? JSON.stringify({ id: editingType.id, name: typeName })
                : JSON.stringify({ name: typeName });

            const res = await fetch('/api/issue-types', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Operation failed');
            }

            await fetchTypes();
            closeModal();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(new Set(types.map(t => t.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleDelete = (id: string, name: string, sessionCount: number) => {
        let message = `Are you sure you want to delete "${name}"? This action cannot be undone.`;
        if (sessionCount > 0) {
            message += `\n\n⚠️ Warning: This issue type is linked to ${sessionCount} chat session${sessionCount > 1 ? 's' : ''}. Deleting it will leave those sessions with no categorized issue type.`;
        }
        setConfirmMessage(message);
        setPendingAction(() => async () => {
            try {
                const res = await fetch(`/api/issue-types?id=${id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete');
                await fetchTypes();
                setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
            } catch (err: any) {
                setError(err.message);
            }
        });
        setConfirmOpen(true);
    };

    const handleBulkDelete = () => {
        if (selectedIds.size === 0) return;

        const selectedTypes = types.filter(t => selectedIds.has(t.id));
        const totalSessions = selectedTypes.reduce((sum, t) => sum + (t._count?.sessions || 0), 0);

        let message = `Are you sure you want to delete ${selectedIds.size} issue type${selectedIds.size > 1 ? 's' : ''}? This action cannot be undone.`;
        if (totalSessions > 0) {
            message += `\n\n⚠️ Warning: The selected types are linked to ${totalSessions} chat session${totalSessions > 1 ? 's' : ''} in total. Deleting them will leave those sessions without an issue type categorization.`;
        }

        setConfirmMessage(message);
        setPendingAction(() => async () => {
            setIsDeletingBulk(true);
            try {
                const res = await fetch(`/api/issue-types`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: Array.from(selectedIds) })
                });
                if (!res.ok) throw new Error((await res.json()).error || 'Failed to bulk delete');
                setSelectedIds(new Set());
                await fetchTypes();
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsDeletingBulk(false);
            }
        });
        setConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (pendingAction) {
            setConfirmOpen(false);
            await pendingAction();
            setPendingAction(null);
        }
    };

    const openModal = (type?: IssueType) => {
        if (type) {
            setEditingType(type);
            setTypeName(type.name);
        } else {
            setEditingType(null);
            setTypeName('');
        }
        setError('');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingType(null);
        setTypeName('');
        setError('');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <AlertTriangle className="w-6 h-6 text-primary-600" />
                        Issue Types
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Manage the specific issue categories logged during chats.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchTypes}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => openModal()}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors shadow-sm text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="whitespace-nowrap">Add Issue Type</span>
                    </button>
                </div>
            </div>

            {selectedIds.size > 0 && (
                <div className="bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 rounded-lg p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 mb-4 animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center gap-3">
                        <span className="bg-primary-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {selectedIds.size}
                        </span>
                        <span className="text-sm font-medium text-primary-900 dark:text-primary-200">issue types selected</span>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                        <button
                            onClick={() => setSelectedIds(new Set())}
                            className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleBulkDelete}
                            disabled={isDeletingBulk}
                            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex-1 sm:flex-none"
                        >
                            {isDeletingBulk ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            Delete Selected
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-sm border border-white/20 dark:border-slate-800/50 hover:shadow-md transition-all duration-300 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64 text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="ml-3 text-sm font-medium">Loading issue types...</span>
                    </div>
                ) : types.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center h-64 px-4 p-8">
                        <AlertTriangle className="w-12 h-12 text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No Issue Types Found</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm">Create a new issue type to categorize the specifics of chat logs.</p>
                        <button
                            onClick={() => openModal()}
                            className="mt-6 text-primary-600 hover:text-primary-700 font-medium text-sm hover:underline"
                        >
                            + Create issue type
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-6 py-4 font-medium w-12 text-center">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500 cursor-pointer"
                                            checked={types.length > 0 && types.every(t => selectedIds.has(t.id))}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th className="px-6 py-4 font-medium">Issue Type Name</th>
                                    <th className="px-6 py-4 font-medium text-center">Sessions Logged</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {types.map((type) => (
                                    <tr key={type.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors ${selectedIds.has(type.id) ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''}`}>
                                        <td className="px-6 py-4 text-center">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500 cursor-pointer"
                                                checked={selectedIds.has(type.id)}
                                                onChange={() => toggleSelect(type.id)}
                                            />
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{type.name}</td>
                                        <td className="px-6 py-4 text-center text-slate-500 dark:text-slate-400">
                                            {type._count?.sessions || 0}
                                        </td>
                                        <td className="px-6 py-4 flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openModal(type)}
                                                className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-slate-800 rounded transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(type.id, type.name, type._count?.sessions || 0)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden transform transition-all border dark:border-slate-800">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                {editingType ? 'Edit Issue Type' : 'Add Issue Type'}
                            </h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors">
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Issue Type Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={typeName}
                                    onChange={(e) => setTypeName(e.target.value)}
                                    placeholder="e.g. Password Reset, Need Refund"
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors sm:text-sm placeholder-slate-400"
                                    autoFocus
                                />
                            </div>

                            <div className="pt-4 flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !typeName.trim()}
                                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 transition-colors flex items-center gap-2"
                                >
                                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingType ? 'Save Changes' : 'Create Issue Type'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmOpen}
                title="Delete Issue Type"
                message={confirmMessage || "Are you sure you want to delete this issue type? This action cannot be undone."}
                confirmLabel="Delete"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={() => { setConfirmOpen(false); setPendingAction(null); }}
            />
        </div>
    );
}
