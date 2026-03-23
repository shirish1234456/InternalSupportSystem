import PageTransition from '@/components/PageTransition';

export default function Template({ children }: { children: React.ReactNode }) {
    return <PageTransition className="w-full h-full">{children}</PageTransition>;
}
