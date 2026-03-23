'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Shield, UserCircle, Loader2, RefreshCw, Power, PowerOff } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';

interface User {
    id: string;
    fullName: string;
    email: string;
    role: 'SuperAdmin' | 'Admin' | 'DataEntry';
    isActive: boolean;
    createdAt: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // Form State
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'SuperAdmin' | 'Admin' | 'DataEntry'>('DataEntry');
    const [password, setPassword] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingToggleUser, setPendingToggleUser] = useState<User | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/users');
            if (!res.ok) throw new Error('Failed to fetch users');
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            setError('Could not load users data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const method = editingUser ? 'PUT' : 'POST';
            const body: any = {
                fullName,
                email,
                role,
                isActive
            };

            if (editingUser) {
                body.id = editingUser.id;
                if (password) body.password = password; // Only send if updating password
            } else {
                body.password = password; // Required for new user
            }

            const res = await fetch('/api/users', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Operation failed');
            }

            await fetchUsers();
            closeModal();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleUserStatus = (user: User) => {
        setPendingToggleUser(user);
        setConfirmOpen(true);
    };

    const confirmToggle = async () => {
        if (!pendingToggleUser) return;
        const user = pendingToggleUser;
        setConfirmOpen(false);
        setPendingToggleUser(null);
        try {
            const res = await fetch('/api/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: user.id,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role,
                    isActive: !user.isActive
                })
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to update status');
            }
            await fetchUsers();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const openModal = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setFullName(user.fullName);
            setEmail(user.email);
            setRole(user.role);
            setIsActive(user.isActive);
        } else {
            setEditingUser(null);
            setFullName('');
            setEmail('');
            setRole('DataEntry');
            setIsActive(true);
        }
        setPassword('');
        setError('');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
        setFullName('');
        setEmail('');
        setRole('DataEntry');
        setPassword('');
        setIsActive(true);
        setError('');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <UserCircle className="w-6 h-6 text-primary-600" />
                        System Users
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Manage system administrators and data entry personnel.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchUsers}
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
                        Add User
                    </button>
                </div>
            </div>

            <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-sm border border-white/20 dark:border-slate-800/50 hover:shadow-md transition-all duration-300 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64 text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="ml-3 text-sm font-medium">Loading users...</span>
                    </div>
                ) : users.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center h-64 px-4 p-8">
                        <UserCircle className="w-12 h-12 text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No Users Found</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm">
                            Add users to give them access to the internal support system.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Full Name</th>
                                    <th className="px-6 py-4 font-medium">Account Info</th>
                                    <th className="px-6 py-4 font-medium">Role</th>
                                    <th className="px-6 py-4 font-medium text-center">Status</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {users.map((user) => (
                                    <tr key={user.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors ${!user.isActive ? 'opacity-60 bg-slate-50 dark:bg-slate-800' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900 dark:text-white">{user.fullName}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-slate-600 dark:text-slate-300">{user.email}</div>
                                            <div className="text-xs text-slate-400 mt-1">ID: {user.id.split('-')[0]}...</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${user.role === 'SuperAdmin' ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800' :
                                                user.role === 'Admin' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border-primary-200 dark:border-primary-800' :
                                                    'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                                }`}>
                                                {user.role === 'SuperAdmin' && <Shield className="w-3 h-3" />}
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openModal(user)}
                                                className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-slate-800 rounded transition-colors"
                                                title="Edit User"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => toggleUserStatus(user)}
                                                className={`p-1.5 rounded transition-colors ${user.isActive
                                                    ? 'text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                                                    : 'text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                                                    }`}
                                                title={user.isActive ? 'Deactivate User' : 'Activate User'}
                                            >
                                                {user.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
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
                                {editingUser ? 'Edit System User' : 'Add System User'}
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
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="e.g. Jane Smith"
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors sm:text-sm placeholder-slate-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    disabled={!!editingUser} // Prevent changing email to avoid conflicts easily
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="jane.smith@company.com"
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors sm:text-sm disabled:bg-slate-100 disabled:dark:bg-slate-800/50 disabled:text-slate-500 placeholder-slate-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    System Role <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={role}
                                    onChange={(e) => setRole(e.target.value as any)}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-colors sm:text-sm"
                                >
                                    <option value="DataEntry">Data Entry (Limited Access)</option>
                                    <option value="Admin">Admin (View Analytics)</option>
                                    <option value="SuperAdmin">SuperAdmin (Full Control)</option>
                                </select>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Determines what pages and features they can access.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    {editingUser ? 'Password (leave blank to keep current)' : 'Initial Password'}
                                    {!editingUser && <span className="text-red-500">*</span>}
                                </label>
                                <input
                                    type="password"
                                    required={!editingUser}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors sm:text-sm placeholder-slate-400"
                                />
                            </div>

                            {editingUser && (
                                <div className="flex items-center gap-2 pt-2">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={isActive}
                                        onChange={(e) => setIsActive(e.target.checked)}
                                        className="w-4 h-4 text-primary-600 border-slate-300 dark:border-slate-700 dark:bg-slate-800 rounded focus:ring-primary-500"
                                    />
                                    <label htmlFor="isActive" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Account is Active
                                    </label>
                                </div>
                            )}

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
                                    disabled={isSubmitting || !fullName.trim() || !email.trim() || (!editingUser && !password)}
                                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 transition-colors flex items-center gap-2"
                                >
                                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingUser ? 'Save Changes' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmOpen}
                title={pendingToggleUser?.isActive ? 'Deactivate User' : 'Activate User'}
                message={pendingToggleUser
                    ? `Are you sure you want to ${pendingToggleUser.isActive ? 'deactivate' : 'activate'} ${pendingToggleUser.fullName}?`
                    : ''
                }
                confirmLabel={pendingToggleUser?.isActive ? 'Deactivate' : 'Activate'}
                variant={pendingToggleUser?.isActive ? 'danger' : 'warning'}
                onConfirm={confirmToggle}
                onCancel={() => { setConfirmOpen(false); setPendingToggleUser(null); }}
            />
        </div>
    );
}
