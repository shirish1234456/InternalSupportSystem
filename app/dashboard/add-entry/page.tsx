'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, Loader2, Save, FileText, User } from 'lucide-react';
import Combobox from '@/components/Combobox';

interface DropdownItem {
    id: string;
    name: string;
}

export default function AddEntryPage() {
    const router = useRouter();

    const [departments, setDepartments] = useState<DropdownItem[]>([]);
    const [agents, setAgents] = useState<DropdownItem[]>([]);
    const [queryTypes, setQueryTypes] = useState<DropdownItem[]>([]);
    const [issueTypes, setIssueTypes] = useState<DropdownItem[]>([]);

    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form State
    const [chatCode, setChatCode] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [school, setSchool] = useState('');
    const [country, setCountry] = useState('');
    const [customerRole, setCustomerRole] = useState('');

    const [departmentId, setDepartmentId] = useState('');
    const [agentId, setAgentId] = useState('');
    const [queryTypeId, setQueryTypeId] = useState('');
    const [issueTypeId, setIssueTypeId] = useState('');

    const [queryDescription, setQueryDescription] = useState('');
    const [resolution, setResolution] = useState('');
    const [status, setStatus] = useState('Open');
    const [feedback, setFeedback] = useState('');

    // Get current local datetime down to minutes for the default value
    const [createdAt, setCreatedAt] = useState(() => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    });

    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const [deptRes, agentRes, queryRes, issueRes] = await Promise.all([
                    fetch('/api/departments'),
                    fetch('/api/agents'),
                    fetch('/api/query-types'),
                    fetch('/api/issue-types')
                ]);

                if (!deptRes.ok || !agentRes.ok || !queryRes.ok || !issueRes.ok) {
                    throw new Error('Failed to load form options');
                }

                const depts = await deptRes.json();
                const agts = await agentRes.json();
                const qTypes = await queryRes.json();
                const iTypes = await issueRes.json();

                setDepartments(depts);
                setAgents(agts);
                setQueryTypes(qTypes);
                setIssueTypes(iTypes);

            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchMasterData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch('/api/chat-sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatCode,
                    customerName,
                    customerEmail,
                    contactNumber,
                    school,
                    country,
                    customerRole,
                    departmentId,
                    agentId,
                    queryTypeId,
                    issueTypeId,
                    queryDescription,
                    resolution,
                    status,
                    feedback,
                    createdAt
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to submit entry');
            }

            setSuccess('Chat session logged successfully!');

            // Reset form (keep dropdown selections for repetitive entries)
            setChatCode('');
            setCustomerName('');
            setCustomerEmail('');
            setContactNumber('');
            setSchool('');
            setCountry('');
            setCustomerRole('');
            setQueryDescription('');
            setResolution('');
            setStatus('Open');
            setFeedback('');

            // Reset time to current
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            setCreatedAt(now.toISOString().slice(0, 16));

            // Auto dismiss success
            setTimeout(() => setSuccess(''), 3000);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="ml-3 font-medium">Loading form configuration...</span>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <PlusCircle className="w-6 h-6 text-primary-600" />
                    Add Manual Entry
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Record a new chat session into the database manually.
                </p>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-center gap-3">
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            {success && (
                <div className="p-4 bg-green-50 text-green-700 rounded-xl border border-green-100 flex items-center gap-3">
                    <p className="text-sm font-medium">{success}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-sm border border-white/20 dark:border-slate-800/50 hover:shadow-md transition-all duration-300 overflow-hidden">
                {/* User Information Section */}
                <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                        <User className="w-5 h-5 text-slate-400" />
                        User Details
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors sm:text-sm"
                                placeholder="Jane Doe"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={customerEmail}
                                onChange={(e) => setCustomerEmail(e.target.value)}
                                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors sm:text-sm"
                                placeholder="jane@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Contact Number
                            </label>
                            <input
                                type="tel"
                                value={contactNumber}
                                onChange={(e) => setContactNumber(e.target.value)}
                                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors sm:text-sm"
                                placeholder="+1 234 567 890"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                School / Organization
                            </label>
                            <input
                                type="text"
                                value={school}
                                onChange={(e) => setSchool(e.target.value)}
                                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors sm:text-sm"
                                placeholder="e.g. Lincoln High"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Country <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors sm:text-sm"
                                placeholder="e.g. United Kingdom"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Role
                            </label>
                            <Combobox
                                options={[
                                    { id: 'Student', name: 'Student' },
                                    { id: 'Teacher', name: 'Teacher' },
                                    { id: 'Parent', name: 'Parent' },
                                    { id: 'Other', name: 'Other' }
                                ]}
                                value={customerRole}
                                onChange={setCustomerRole}
                                placeholder="Select Role"
                                searchable={false}
                            />
                        </div>
                    </div>
                </div>

                {/* Chat Session Section */}
                <div className="p-4 md:p-6 space-y-6">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-slate-400" />
                        Chat Session Metadata
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Chat Code (Unique ID) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={chatCode}
                                onChange={(e) => setChatCode(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors sm:text-sm bg-slate-50 dark:bg-slate-800"
                                placeholder="e.g. CHAT-10293"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Handling Agent <span className="text-red-500">*</span>
                            </label>
                            <Combobox
                                options={agents}
                                value={agentId}
                                onChange={setAgentId}
                                placeholder="Select Agent"
                                searchable={false}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Department <span className="text-red-500">*</span>
                            </label>
                            <Combobox
                                options={departments}
                                value={departmentId}
                                onChange={setDepartmentId}
                                placeholder="Select Department"
                                searchable={false}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 pb-2 border-b border-slate-100 dark:border-slate-800">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Query Type <span className="text-red-500">*</span>
                            </label>
                            <Combobox
                                options={queryTypes}
                                value={queryTypeId}
                                onChange={setQueryTypeId}
                                placeholder="Select Query Type"
                                searchable={false}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Issue Type <span className="text-red-500">*</span>
                            </label>
                            <Combobox
                                options={issueTypes}
                                value={issueTypeId}
                                onChange={setIssueTypeId}
                                placeholder="Select Specific Issue"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-6 pt-2">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Query Description <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                required
                                rows={3}
                                value={queryDescription}
                                onChange={(e) => setQueryDescription(e.target.value)}
                                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors sm:text-sm resize-none"
                                placeholder="What was the user's initial question or problem?"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Date & Time <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                required
                                value={createdAt}
                                onChange={(e) => setCreatedAt(e.target.value)}
                                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors sm:text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Resolution Provided
                            </label>
                            <textarea
                                rows={3}
                                value={resolution}
                                onChange={(e) => setResolution(e.target.value)}
                                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors sm:text-sm resize-none"
                                placeholder="How was the issue solved? (Leave blank if open)"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Current Status <span className="text-red-500">*</span>
                            </label>
                            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                                {['Open', 'Resolved', 'Escalated'].map((s) => (
                                    <label key={s} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="status"
                                            value={s}
                                            checked={status === s}
                                            onChange={(e) => setStatus(e.target.value)}
                                            className="w-4 h-4 text-primary-600 border-slate-300 dark:border-slate-700 dark:bg-slate-900 focus:ring-primary-500 disabled:opacity-50"
                                        />
                                        <span className={`text-sm font-medium ${s === status ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>{s}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                User Feedback Rating
                            </label>
                            <Combobox
                                options={[
                                    { id: 'Happy', name: '😃 Happy' },
                                    { id: 'Neutral', name: '😐 Neutral' },
                                    { id: 'Sad', name: '☹️ Sad' }
                                ]}
                                value={feedback}
                                onChange={setFeedback}
                                placeholder="None provided"
                                searchable={false}
                            />
                        </div>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="px-4 md:px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || !chatCode || !customerName || !country || !agentId || !departmentId || !queryTypeId || !issueTypeId || !queryDescription}
                        className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        <span className="whitespace-nowrap">Save Record</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
