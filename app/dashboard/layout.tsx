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
            {/* Main Content Area handled by Wrapper */}

            <DashboardClientWrapper user={session}>
                {children}
            </DashboardClientWrapper>
        </div>
    );
}
