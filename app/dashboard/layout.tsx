import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import DashboardClientWrapper from '@/components/DashboardClientWrapper';

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

            <DashboardClientWrapper user={session}>
                {children}
            </DashboardClientWrapper>
        </div>
    );
}
