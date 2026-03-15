'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, Loader2, Mail, Clock, CalendarDays, CheckCircle2 } from 'lucide-react';

interface SystemSettings {
    weeklyReportTime: string;
    weeklyReportDay: string;
    reportRecipientEmail: string;
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<SystemSettings>({
        weeklyReportTime: '08:00',
        weeklyReportDay: 'Monday',
        reportRecipientEmail: ''
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings');
                if (!res.ok) throw new Error('Failed to load settings');
                const data = await res.json();
                setSettings(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update settings');
            }

            setSuccess('Settings saved successfully');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleManualTrigger = async () => {
        if (!confirm("Are you sure you want to test send the weekly email report now?")) return;

        try {
            const res = await fetch('/api/cron/weekly-report');
            const data = await res.json();
            alert(data.message || 'Report sent!');
        } catch (err: any) {
            alert('Failed to send test email.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="ml-3 font-medium">Loading settings...</span>
            </div>
        );
    }

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-12">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Settings className="w-6 h-6 text-blue-600" />
                    System Settings
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Configure automated tasks, notifications, and global system parameters.
                </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                        <Mail className="w-5 h-5 text-slate-400" />
                        Automated Weekly Analytics Report
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Configure when and where the weekly summary email is sent. Note: This requires an external cron trigger pointing to `/api/cron/weekly-report`.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="p-4 bg-green-50 text-green-700 text-sm rounded-lg border border-green-100 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5" />
                            {success}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                <CalendarDays className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                Report Delivery Day
                            </label>
                            <select
                                required
                                value={settings.weeklyReportDay}
                                onChange={(e) => setSettings({ ...settings, weeklyReportDay: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors sm:text-sm"
                            >
                                {daysOfWeek.map(day => (
                                    <option key={day} value={day}>{day}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                Time (HH:MM 24h)
                            </label>
                            <input
                                type="time"
                                required
                                value={settings.weeklyReportTime}
                                onChange={(e) => setSettings({ ...settings, weeklyReportTime: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors sm:text-sm bg-white dark:bg-slate-800 min-h-10"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Recipient Email Address(es)
                        </label>
                        <input
                            type="text"
                            required
                            value={settings.reportRecipientEmail}
                            onChange={(e) => setSettings({ ...settings, reportRecipientEmail: e.target.value })}
                            placeholder="admin@company.com, ceo@company.com"
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 text-slate-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 transition-colors sm:text-sm bg-white dark:bg-slate-800"
                        />
                        <p className="text-xs text-slate-500 mt-1">Separate multiple emails with commas.</p>
                    </div>

                    <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 mt-6">
                        <button
                            type="button"
                            onClick={handleManualTrigger}
                            className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors border border-blue-200 dark:border-blue-900"
                        >
                            Send Test Email Now
                        </button>

                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Save Configuration
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
