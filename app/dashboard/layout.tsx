import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session) {
        redirect('/login');
    }

    return (
        <div className={`flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans relative theme-${session.accentColor || 'blue'}`}>
            {/* Premium Ambient Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-50/80 via-slate-50 to-primary-100/50 dark:from-slate-950 dark:via-slate-900/90 dark:to-primary-950/30 pointer-events-none z-0 animate-in fade-in duration-1000" />

            <Sidebar user={session} />

            {/* Main Content Area */}
            <div className="flex-1 ml-64 flex flex-col overflow-hidden z-10 relative">
                <header className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 h-14 flex items-center px-8 z-30 flex-shrink-0">
                    <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-tight">
                        Internal Support System
                    </h2>
                    <div className="ml-auto flex items-center gap-3">
                        <ThemeToggle />
                        <div className="text-sm font-medium text-slate-600 dark:text-slate-400 border-l border-slate-200/50 dark:border-slate-700/50 pl-3">
                            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-600 dark:from-primary-400 dark:to-primary-400 font-bold tracking-wide">{session.fullName}</span>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 lg:p-8">
                    <div className="mx-auto max-w-7xl relative z-10">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
