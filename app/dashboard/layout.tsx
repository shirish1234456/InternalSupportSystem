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
        <div className="flex h-screen bg-slate-100 dark:bg-slate-950 overflow-hidden font-sans">
            <Sidebar user={session} />

            {/* Main Content Area */}
            <div className="flex-1 ml-64 flex flex-col overflow-hidden">
                <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-14 flex items-center px-8 z-10 flex-shrink-0">
                    <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-tight">
                        Internal Support System
                    </h2>
                    <div className="ml-auto flex items-center gap-3">
                        <ThemeToggle />
                        <div className="text-sm font-medium text-slate-600 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700 pl-3">
                            Welcome back, <span className="text-blue-600 dark:text-blue-400 font-semibold">{session.fullName}</span>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 dark:bg-slate-950 p-6 lg:p-8">
                    <div className="mx-auto max-w-7xl">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
