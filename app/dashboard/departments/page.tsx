'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Building2, Loader2, RefreshCw } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';

interface Department {
    id: string;
    name: string;
    createdAt: string;
    _count: {
        agents: number;
        sessions: number;
    };
}

export default function DepartmentsPage() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [deptName, setDeptName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/departments');
            if (!res.ok) throw new Error('Failed to fetch departments');
            const data = await res.json();
            setDepartments(data);
        } catch (err) {
            setError('Could not load departments.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const method = editingDept ? 'PUT' : 'POST';
            const body = editingDept
                ? JSON.stringify({ id: editingDept.id, name: deptName })
                : JSON.stringify({ name: deptName });

            const res = await fetch('/api/departments', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Operation failed');
            }

            await fetchDepartments();
            closeModal();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (id: string) => {
        setPendingDeleteId(id);
        setConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!pendingDeleteId) return;
        setConfirmOpen(false);
        try {
            const res = await fetch(`/api/departments?id=${pendingDeleteId}`, {
                method: 'DELETE'
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to delete');
            }
            await fetchDepartments();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setPendingDeleteId(null);
        }
    };

    const openModal = (dept?: Department) => {
        if (dept) {
            setEditingDept(dept);
            setDeptName(dept.name);
        } else {
            setEditingDept(null);
            setDeptName('');
        }
        setError('');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingDept(null);
        setDeptName('');
        setError('');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Building2 className="w-6 h-6 text-blue-600" />
                        Departments
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Manage system departments and their mapping.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchDepartments}
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => openModal()}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        Add Department
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64 text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="ml-3 text-sm font-medium">Loading departments...</span>
                    </div>
                ) : departments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center h-64 px-4 p-8">
                        <Building2 className="w-12 h-12 text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No Departments Found</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm">Get started by creating a new department to categorize your agents and chat logs.</p>
                        <button
                            onClick={() => openModal()}
                            className="mt-6 text-blue-600 hover:text-blue-700 font-medium text-sm hover:underline"
                        >
                            + Create your first department
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Department Name</th>
                                    <th className="px-6 py-4 font-medium text-center">Agents</th>
                                    <th className="px-6 py-4 font-medium text-center">Sessions Logged</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {departments.map((dept) => (
                                    <tr key={dept.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{dept.name}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
                                                {dept._count?.agents || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-slate-500 dark:text-slate-400">
                                            {dept._count?.sessions || 0}
                                        </td>
                                        <td className="px-6 py-4 flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openModal(dept)}
                                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(dept.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                title="Delete"
                                                disabled={dept._count?.agents > 0 || dept._count?.sessions > 0}
                                                aria-disabled={dept._count?.agents > 0 || dept._count?.sessions > 0}
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

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden transform transition-all border dark:border-slate-800">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                {editingDept ? 'Edit Department' : 'Add Department'}
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
                                    Department Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={deptName}
                                    onChange={(e) => setDeptName(e.target.value)}
                                    placeholder="e.g. Technical Support"
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors sm:text-sm placeholder-slate-400"
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
                                    disabled={isSubmitting || !deptName.trim()}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors flex items-center gap-2"
                                >
                                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingDept ? 'Save Changes' : 'Create Department'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmOpen}
                title="Delete Department"
                message="Are you sure you want to delete this department? This action cannot be undone."
                confirmLabel="Delete"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={() => { setConfirmOpen(false); setPendingDeleteId(null); }}
            />
        </div>
    );
}
