'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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
    isCollapsed: boolean;
    setIsCollapsed: (val: boolean) => void;
}

export default function Sidebar({ user, isCollapsed, setIsCollapsed }: SidebarProps) {
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
        Admin: 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-800/50',
        DataEntry: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800/50',
    };

    return (
        <div className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-800/50 h-screen fixed left-0 top-0 flex flex-col shadow-sm z-20 transition-all duration-300`}>
            {/* Brand */}
            <div className={`px-5 py-5 border-b border-slate-100/50 dark:border-slate-800/50 flex items-center ${isCollapsed ? 'justify-center px-0' : ''}`}>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <motion.div whileHover={{ scale: 1.05, rotate: 5 }} whileTap={{ scale: 0.95 }} className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md shrink-0">
                        <MessageSquare className="w-4 h-4 text-white" />
                    </motion.div>
                    {!isCollapsed && <span>SupportHub</span>}
                </h1>
            </div>

            {/* User badge */}
            {user && (
                <div className={`px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex ${isCollapsed ? 'justify-center px-0' : ''}`}>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0" title={user.fullName}>
                            <span className="text-sm font-bold text-primary-700 dark:text-primary-300">
                                {user.fullName?.charAt(0)?.toUpperCase()}
                            </span>
                        </div>
                        {!isCollapsed && (
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{user.fullName}</p>
                                <span className={`inline-flex mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${roleColors[user.role] || roleColors.DataEntry}`}>
                                    {user.role}
                                </span>
                            </div>
                        )}
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
                            {!isCollapsed && (
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5 px-2">
                                    {group.label}
                                </p>
                            )}
                            {isCollapsed && <div className="h-4" />} {/* Spacer for collapsed mode */}
                            <div className="space-y-0.5">
                                {visibleItems.map((item) => {
                                    const isActive = item.href === '/dashboard'
                                        ? pathname === item.href
                                        : pathname === item.href || pathname.startsWith(`${item.href}/`);
                                    const Icon = item.icon;

                                    return (
                                        <motion.div key={item.href} whileHover={{ x: isCollapsed ? 0 : 4 }} whileTap={{ scale: 0.98 }}>
                                            <Link
                                                href={item.href}
                                                title={isCollapsed ? item.name : undefined}
                                                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium group ${isCollapsed ? 'justify-center' : ''} ${isActive
                                                    ? 'bg-gradient-to-r from-primary-600 to-primary-600 text-white shadow-md shadow-primary-500/20'
                                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                                                    }`}
                                            >
                                                <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-white'}`} />
                                                {!isCollapsed && <span>{item.name}</span>}
                                            </Link>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className={`px-3 py-3 border-t border-slate-100/50 dark:border-slate-800/50 flex flex-col gap-2 ${isCollapsed ? 'items-center' : ''}`}>
                <div className={`flex items-center w-full ${isCollapsed ? 'justify-center' : 'justify-between px-2'} mb-1`}>
                    {!isCollapsed && <span className="text-xs font-semibold text-slate-400">Theme</span>}
                    <ThemeToggle />
                </div>

                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all w-full ${isCollapsed ? 'justify-center' : ''}`}
                    title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}><path d="m15 18-6-6 6-6" /><path d="M3 6h2" /><path d="M3 12h2" /><path d="M3 18h2" /></svg>
                    {!isCollapsed && <span>Collapse</span>}
                </button>

                <button
                    onClick={handleLogout}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all w-full ${isCollapsed ? 'justify-center' : ''}`}
                    title={isCollapsed ? "Sign Out" : undefined}
                >
                    <LogOut className="w-4 h-4 shrink-0" />
                    {!isCollapsed && <span>Sign Out</span>}
                </button>
            </div>
        </div>
    );
}
