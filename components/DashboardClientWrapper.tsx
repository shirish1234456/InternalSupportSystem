'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { JWTPayload } from '@/lib/auth';
import { ThemeToggle } from '@/components/ThemeToggle';

interface DashboardClientWrapperProps {
    user: JWTPayload;
    children: React.ReactNode;
}

export default function DashboardClientWrapper({ user, children }: DashboardClientWrapperProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Optional: Auto-collapse on smaller screens
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsCollapsed(true);
            } else {
                setIsCollapsed(false);
            }
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <>
            <Sidebar user={user} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

            {/* Main Content Area */}
            <div
                className={`flex-1 flex flex-col overflow-hidden z-10 relative transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}
            >
                <header className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 h-14 flex items-center px-4 md:px-8 z-30 flex-shrink-0">
                    <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-tight hidden sm:block">
                        Internal Support System
                    </h2>
                    <div className="ml-auto flex items-center gap-3">
                        <ThemeToggle />
                        <div className="text-sm font-medium text-slate-600 dark:text-slate-400 border-l border-slate-200/50 dark:border-slate-700/50 pl-3">
                            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-600 dark:from-primary-400 dark:to-primary-400 font-bold tracking-wide">{user.fullName}</span>
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
