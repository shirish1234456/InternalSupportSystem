'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    BarChart3,
    MessageSquare,
    PlusCircle,
    Upload,
    Building2,
    HelpCircle,
    AlertTriangle,
    Users,
    Settings,
    LogOut,
    UserCircle,
    PieChart
} from 'lucide-react';
import { JWTPayload } from '@/lib/auth';
import { ThemeToggle } from '@/components/ThemeToggle';

interface SidebarProps {
    user: JWTPayload | null;
}

export default function Sidebar({ user }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
            router.refresh();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const navGroups = [
        {
            label: 'Main',
            items: [
                { name: 'Dashboard', href: '/dashboard', icon: BarChart3, roles: ['SuperAdmin', 'Admin', 'DataEntry'] },
                { name: 'Analytics', href: '/dashboard/analytics', icon: PieChart, roles: ['SuperAdmin', 'Admin', 'DataEntry'] },
                { name: 'Add Entry', href: '/dashboard/add-entry', icon: PlusCircle, roles: ['SuperAdmin', 'Admin', 'DataEntry'] },
                { name: 'Chat Logs', href: '/dashboard/chat-logs', icon: MessageSquare, roles: ['SuperAdmin', 'Admin', 'DataEntry'] },
                { name: 'Bulk Import', href: '/dashboard/bulk-import', icon: Upload, roles: ['SuperAdmin'] },
            ]
        },
        {
            label: 'Master Data',
            roles: ['SuperAdmin'],
            items: [
                { name: 'Departments', href: '/dashboard/departments', icon: Building2, roles: ['SuperAdmin'] },
                { name: 'Query Types', href: '/dashboard/query-types', icon: HelpCircle, roles: ['SuperAdmin'] },
                { name: 'Issue Types', href: '/dashboard/issue-types', icon: AlertTriangle, roles: ['SuperAdmin'] },
                { name: 'Agents', href: '/dashboard/agents', icon: Users, roles: ['SuperAdmin'] },
            ]
        },
        {
            label: 'System',
            roles: ['SuperAdmin', 'Admin', 'DataEntry'],
            items: [
                { name: 'My Profile', href: '/dashboard/profile', icon: UserCircle, roles: ['SuperAdmin', 'Admin', 'DataEntry'] },
                { name: 'Users', href: '/dashboard/users', icon: Users, roles: ['SuperAdmin'] },
                { name: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['SuperAdmin'] },
            ]
        }
    ];

    const roleColors: Record<string, string> = {
        SuperAdmin: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 border-violet-200 dark:border-violet-800/50',
        Admin: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800/50',
        DataEntry: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800/50',
    };

    return (
        <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen fixed left-0 top-0 flex flex-col shadow-sm">
            {/* Brand */}
            <div className="px-5 py-5 border-b border-slate-100 dark:border-slate-800">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
                        <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                    SupportHub
                </h1>
            </div>

            {/* User badge */}
            {user && (
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                                {user.fullName?.charAt(0)?.toUpperCase()}
                            </span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{user.fullName}</p>
                            <span className={`inline-flex mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${roleColors[user.role] || roleColors.DataEntry}`}>
                                {user.role}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
                {navGroups.map((group, idx) => {
                    if (group.roles && (!user || !group.roles.includes(user.role))) {
                        return null;
                    }

                    const visibleItems = group.items.filter(item => user && item.roles.includes(user.role));
                    if (visibleItems.length === 0) return null;

                    return (
                        <div key={idx}>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5 px-2">
                                {group.label}
                            </p>
                            <div className="space-y-0.5">
                                {visibleItems.map((item) => {
                                    const isActive = item.href === '/dashboard'
                                        ? pathname === item.href
                                        : pathname === item.href || pathname.startsWith(`${item.href}/`);
                                    const Icon = item.icon;

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-medium group ${isActive
                                                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                                }`}
                                        >
                                            <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-white'}`} />
                                            {item.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="px-3 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <button
                    onClick={handleLogout}
                    className="flex flex-1 items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
                <ThemeToggle />
            </div>
        </div>
    );
}
