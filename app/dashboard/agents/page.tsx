'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, Loader2, RefreshCw } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import Combobox from '@/components/Combobox';

interface Department {
    id: string;
    name: string;
}

interface Agent {
    id: string;
    name: string;
    shift: string;
    departmentId: string | null;
    department: Department | null;
    createdAt: string;
    _count: {
        sessions: number;
    };
}

export default function AgentsPage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [shift, setShift] = useState('Morning'); // Default
    const [departmentId, setDepartmentId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resAgents, resDepts] = await Promise.all([
                fetch('/api/agents'),
                fetch('/api/departments')
            ]);

            if (!resAgents.ok || !resDepts.ok) throw new Error('Failed to fetch data');

            const [agentsData, deptsData] = await Promise.all([
                resAgents.json(),
                resDepts.json()
            ]);

            setAgents(agentsData);
            setDepartments(deptsData);

            if (deptsData.length > 0 && !departmentId) {
                setDepartmentId(deptsData[0].id);
            }
        } catch (err) {
            setError('Could not load agents data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const method = editingAgent ? 'PUT' : 'POST';
            const body = {
                id: editingAgent?.id,
                name,
                shift,
                departmentId
            };

            const res = await fetch('/api/agents', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Operation failed');
            }

            await fetchData();
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
            const res = await fetch(`/api/agents?id=${pendingDeleteId}`, {
                method: 'DELETE'
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to delete');
            }
            await fetchData();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setPendingDeleteId(null);
        }
    };

    const openModal = (agent?: Agent) => {
        if (agent) {
            setEditingAgent(agent);
            setName(agent.name);
            setShift(agent.shift);
            setDepartmentId(agent.departmentId || '');
        } else {
            setEditingAgent(null);
            setName('');
            setShift('Morning');
            setDepartmentId('');
        }
        setError('');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingAgent(null);
        setName('');
        setShift('Morning');
        setError('');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Users className="w-6 h-6 text-primary-600" />
                        Support Agents
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Manage agents who handle user chats.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchData}
                        className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => openModal()}
                        className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors shadow-sm text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        Add Agent
                    </button>
                </div>
            </div>

            <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-sm border border-white/20 dark:border-slate-800/50 hover:shadow-md transition-all duration-300 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64 text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="ml-3 text-sm font-medium">Loading agents...</span>
                    </div>
                ) : agents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center h-64 px-4 p-8">
                        <Users className="w-12 h-12 text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No Agents Found</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm">
                            Add an agent to start tracking their performance and chat logs.
                        </p>
                        <button
                            onClick={() => openModal()}
                            className="mt-6 text-primary-600 hover:text-primary-700 font-medium text-sm hover:underline"
                        >
                            + Create your first agent
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Agent Name</th>
                                    <th className="px-6 py-4 font-medium">Department</th>
                                    <th className="px-6 py-4 font-medium">Shift</th>
                                    <th className="px-6 py-4 font-medium text-center">Sessions Handled</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {agents.map((agent) => (
                                    <tr key={agent.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{agent.name}</td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{agent.department?.name || <span className="text-slate-400 italic">Unassigned</span>}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                {agent.shift}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-slate-500 dark:text-slate-400">
                                            {agent._count?.sessions || 0}
                                        </td>
                                        <td className="px-6 py-4 flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openModal(agent)}
                                                className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-slate-800 rounded transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(agent.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                title="Delete"
                                                disabled={agent._count?.sessions > 0}
                                                aria-disabled={agent._count?.sessions > 0}
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
                                {editingAgent ? 'Edit Agent' : 'Add Agent'}
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
                                    Agent Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. John Doe"
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors sm:text-sm placeholder-slate-400"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Department
                                </label>
                                <Combobox
                                    options={[
                                        { id: '', name: 'None (Unassigned)' },
                                        ...departments
                                    ]}
                                    value={departmentId || ''}
                                    onChange={setDepartmentId}
                                    placeholder="None (Unassigned)"
                                    searchable={false}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Shift <span className="text-red-500">*</span>
                                </label>
                                <Combobox
                                    options={[
                                        { id: 'Morning', name: 'Morning' },
                                        { id: 'Afternoon', name: 'Afternoon' },
                                        { id: 'Night', name: 'Night' }
                                    ]}
                                    value={shift}
                                    onChange={setShift}
                                    placeholder="Select Shift"
                                    searchable={false}
                                    required
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
                                    disabled={isSubmitting || !name.trim()}
                                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 transition-colors flex items-center gap-2"
                                >
                                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingAgent ? 'Save Changes' : 'Create Agent'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmOpen}
                title="Delete Agent"
                message="Are you sure you want to delete this agent? This action cannot be undone."
                confirmLabel="Delete"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={() => { setConfirmOpen(false); setPendingDeleteId(null); }}
            />
        </div>
    );
}
