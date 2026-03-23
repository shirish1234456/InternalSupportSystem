'use client';

import { useState, useEffect } from 'react';
import { UserCircle, Key, Mail, Shield, AlertTriangle, CheckCircle2, Loader2, Save, Palette } from 'lucide-react';

interface ProfileData {
    fullName: string;
    email: string;
    role: string;
    accentColor?: string;
}

const ACCENT_COLORS = [
    { id: 'blue', name: 'Support Blue', bgClass: 'bg-blue-600', borderClass: 'border-blue-600' },
    { id: 'emerald', name: 'Emerald', bgClass: 'bg-emerald-500', borderClass: 'border-emerald-500' },
    { id: 'rose', name: 'Rose', bgClass: 'bg-rose-500', borderClass: 'border-rose-500' },
    { id: 'violet', name: 'Violet', bgClass: 'bg-violet-500', borderClass: 'border-violet-500' },
    { id: 'amber', name: 'Amber', bgClass: 'bg-amber-500', borderClass: 'border-amber-500' }
];

export default function ProfilePage() {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Name Change State
    const [nameInput, setNameInput] = useState('');
    const [nameSaving, setNameSaving] = useState(false);
    const [nameError, setNameError] = useState('');
    const [nameSuccess, setNameSuccess] = useState('');

    // Password Change State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [saving, setSaving] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    // Theme Update State
    const [themeSaving, setThemeSaving] = useState(false);
    const [themeSuccess, setThemeSuccess] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch('/api/profile');
                const data = await res.json();

                if (!res.ok) throw new Error(data.error || 'Failed to fetch profile data');

                setProfile(data);
                setNameInput(data.fullName);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setNameError('');
        setNameSuccess('');

        if (!nameInput.trim()) {
            setNameError('Full Name is required');
            return;
        }

        setNameSaving(true);
        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_profile', fullName: nameInput })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to update profile');
            }

            setNameSuccess('Profile updated successfully!');
            setProfile(prev => prev ? { ...prev, fullName: nameInput.trim() } : prev);

            // Force a hard reload to update the JWT-based Sidebar state visually without complex React Context plumbing
            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } catch (err: any) {
            setNameError(err.message);
        } finally {
            setNameSaving(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (newPassword !== confirmPassword) {
            setPasswordError('New passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            setPasswordError('New password must be at least 8 characters long');
            return;
        }

        setSaving(true);

        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_password', currentPassword, newPassword })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to update password');
            }

            setPasswordSuccess('Password successfully updated!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

            setTimeout(() => setPasswordSuccess(''), 5000);

        } catch (err: any) {
            setPasswordError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleThemeChange = async (colorId: string) => {
        if (!profile || profile.accentColor === colorId) return;
        setThemeSaving(true);
        setThemeSuccess('');

        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_theme', accentColor: colorId })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setProfile(prev => prev ? { ...prev, accentColor: colorId } : prev);
            setThemeSuccess('Theme updated. Reloading...');

            // Force hard reload to update root layout theme class
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } catch (err) {
            console.error('Failed to change theme:', err);
        } finally {
            setThemeSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="ml-3 font-medium">Loading profile...</span>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="p-6 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/50 flex flex-col items-center justify-center h-64">
                <AlertTriangle className="w-10 h-10 mb-3 text-red-500" />
                <p className="font-medium text-lg">Error loading profile</p>
                <p className="text-sm mt-1">{error}</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <UserCircle className="w-6 h-6 text-primary-600" />
                    My Profile
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Manage your account details and security settings.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Account Details Card */}
                <div className="md:col-span-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-sm overflow-hidden h-fit">
                    <div className="p-6 flex flex-col items-center text-center">
                        <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center mb-4">
                            <span className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                                {profile.fullName.charAt(0).toUpperCase()}
                            </span>
                        </div>

                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 mb-4 border border-primary-200 dark:border-primary-800/50">
                            <Shield className="w-3.5 h-3.5" />
                            {profile.role}
                        </span>

                        <form onSubmit={handleProfileUpdate} className="w-full space-y-4">
                            {nameError && (
                                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100 text-left">
                                    {nameError}
                                </div>
                            )}

                            {nameSuccess && (
                                <div className="p-3 bg-green-50 text-green-700 text-xs rounded-lg border border-green-100 text-left">
                                    {nameSuccess}
                                </div>
                            )}

                            <div className="text-left">
                                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={nameInput}
                                    onChange={(e) => setNameInput(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-sm font-medium"
                                />
                            </div>

                            <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-800 text-left space-y-3">
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Email Address</p>
                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium text-sm px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800">
                                        <Mail className="w-4 h-4 text-slate-400" />
                                        {profile.email}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1.5 italic">Email cannot be changed directly.</p>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={nameSaving || nameInput === profile.fullName}
                                className="w-full mt-4 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-900/50 rounded-lg transition-colors border border-primary-200 dark:border-primary-900 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {nameSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Name
                            </button>
                        </form>
                    </div>
                </div>

                {/* Security Settings Card */}
                <div className="md:col-span-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                            <Key className="w-5 h-5 text-slate-400" />
                            Security Settings
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                            Update your password to keep your account secure.
                        </p>
                    </div>

                    <form onSubmit={handlePasswordChange} className="p-6 space-y-6">

                        {passwordError && (
                            <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                                {passwordError}
                            </div>
                        )}

                        {passwordSuccess && (
                            <div className="p-4 bg-green-50 text-green-700 text-sm rounded-lg border border-green-100 flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 shrink-0" />
                                {passwordSuccess}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                    Current Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors sm:text-sm"
                                />
                            </div>

                            <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-800"></div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors sm:text-sm"
                                />
                                <p className="text-xs text-slate-500 mt-1.5">Must be at least 8 characters long.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors sm:text-sm"
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-2.5 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                Update Password
                            </button>
                        </div>
                    </form>
                </div>

                {/* Personalization Settings Card */}
                <div className="md:col-span-3 border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-xl shadow-sm overflow-hidden mt-6">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                                <Palette className="w-5 h-5 text-slate-400" />
                                Personalization
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">
                                Customize your dashboard accent color.
                            </p>
                        </div>
                        {themeSuccess && (
                            <span className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" />
                                {themeSuccess}
                            </span>
                        )}
                        {themeSaving && (
                            <span className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </span>
                        )}
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                            {ACCENT_COLORS.map((color) => {
                                const isSelected = (profile.accentColor || 'blue') === color.id;
                                const activeClasses = color.borderClass + ' bg-slate-50 dark:bg-slate-800 shadow-md scale-105';
                                const inactiveClasses = 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50';

                                return (
                                    <button
                                        key={color.id}
                                        onClick={() => handleThemeChange(color.id)}
                                        disabled={themeSaving}
                                        className={'flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ' + (isSelected ? activeClasses : inactiveClasses)}
                                    >
                                        <div className={'w-8 h-8 rounded-full shadow-sm ' + color.bgClass + ' ' + (isSelected ? 'ring-4 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ' + color.borderClass : '')} />
                                        <span className={'text-sm font-medium ' + (isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400')}>
                                            {color.name}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

            </div>
        </div >
    );
}
