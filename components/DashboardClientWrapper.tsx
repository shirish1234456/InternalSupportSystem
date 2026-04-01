'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { JWTPayload } from '@/lib/auth';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Menu, X } from 'lucide-react';

interface DashboardClientWrapperProps {
    user: JWTPayload;
    children: React.ReactNode;
}

export default function DashboardClientWrapper({ user, children }: DashboardClientWrapperProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Optional: Auto-collapse on medium screens, hide on small
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsCollapsed(true);
            } else {
                setIsCollapsed(false);
                setIsMobileOpen(false); // Close mobile drawer if resizing to desktop
            }
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <>
            {/* Mobile Backdrop */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            <Sidebar
                user={user}
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
                isMobileOpen={isMobileOpen}
                setIsMobileOpen={setIsMobileOpen}
            />

            {/* Main Content Area */}
            <div
                className={`flex-1 flex flex-col min-h-screen overflow-hidden z-10 relative transition-all duration-300 ${isCollapsed ? 'lg:ml-[5.5rem]' : 'lg:ml-[17rem]'} ml-0 mr-3 my-3 rounded-2xl overflow-hidden`}
            >
                <header className="bg-white/40 dark:bg-slate-900/10 backdrop-blur-3xl border-b border-white/10 dark:border-white/5 h-14 flex items-center px-4 md:px-8 z-30 flex-shrink-0">
                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setIsMobileOpen(!isMobileOpen)}
                        className="p-2 -ml-2 mr-2 text-slate-500 hover:text-slate-900 dark:hover:text-white lg:hidden rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        aria-label="Toggle Menu"
                    >
                        {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>

                    <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-tight hidden sm:block">
                        Internal Support System
                    </h2>
                    <div className="ml-auto flex items-center gap-3">
                        <ThemeToggle />
                        <div className="text-sm font-medium text-slate-600 dark:text-slate-400 border-l border-slate-200/50 dark:border-slate-700/50 pl-3">
                            <span className="hidden xs:inline">Welcome back, </span>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-600 dark:from-primary-400 dark:to-primary-400 font-bold tracking-wide">{user.fullName}</span>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8">
                    <div className="w-full relative z-10">
                        {children}
                    </div>
                </main>
            </div>
        </>
    );
}
