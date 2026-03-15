import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';



export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== 'SuperAdmin') {
            return NextResponse.json({ error: 'Forbidden. SuperAdmin only.' }, { status: 403 });
        }

        // Always fetch the row with ID 1
        let settings = await prisma.systemSettings.findUnique({
            where: { id: 1 }
        });

        // If it doesn't exist yet, seed it with defaults
        if (!settings) {
            settings = await prisma.systemSettings.create({
                data: {
                    id: 1,
                    weeklyReportTime: '08:00',
                    weeklyReportDay: 'Monday',
                    reportRecipientEmail: 'admin@company.com'
                }
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Failed to fetch settings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'SuperAdmin') {
            return NextResponse.json({ error: 'Forbidden. SuperAdmin only.' }, { status: 403 });
        }

        const { weeklyReportTime, weeklyReportDay, reportRecipientEmail } = await req.json();

        if (!weeklyReportTime || !weeklyReportDay || !reportRecipientEmail) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        const settings = await prisma.systemSettings.upsert({
            where: { id: 1 },
            update: {
                weeklyReportTime,
                weeklyReportDay,
                reportRecipientEmail
            },
            create: {
                id: 1,
                weeklyReportTime,
                weeklyReportDay,
                reportRecipientEmail
            }
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Failed to update settings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
