import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    const customers = await prisma.customer.findMany({
        select: { fullName: true, visitorId: true, role: true }
    });

    const sessions = await prisma.chatSession.findMany({
        select: { chatCode: true, emailSent: true }
    });

    return NextResponse.json({ customers, sessions });
}
