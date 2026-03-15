import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';



export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const issueTypes = await prisma.issueType.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { sessions: true }
                }
            }
        });

        return NextResponse.json(issueTypes);
    } catch (error) {
        console.error('Failed to fetch issue types:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'SuperAdmin') {
            return NextResponse.json({ error: 'Forbidden. SuperAdmin only.' }, { status: 403 });
        }

        const { name } = await req.json();

        if (!name) {
            return NextResponse.json({ error: 'Issue Type name is required' }, { status: 400 });
        }

        const existing = await prisma.issueType.findUnique({ where: { name } });

        if (existing) {
            return NextResponse.json({ error: 'Issue Type with this name already exists' }, { status: 409 });
        }

        const issueType = await prisma.issueType.create({ data: { name } });

        return NextResponse.json(issueType, { status: 201 });
    } catch (error) {
        console.error('Failed to create issue type:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'SuperAdmin') {
            return NextResponse.json({ error: 'Forbidden. SuperAdmin only.' }, { status: 403 });
        }

        const { id, name } = await req.json();

        if (!id || !name) {
            return NextResponse.json({ error: 'ID and Name are required' }, { status: 400 });
        }

        const issueType = await prisma.issueType.update({
            where: { id },
            data: { name }
        });

        return NextResponse.json(issueType);
    } catch (error) {
        console.error('Failed to update issue type:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'SuperAdmin') {
            return NextResponse.json({ error: 'Forbidden. SuperAdmin only.' }, { status: 403 });
        }

        const url = new URL(req.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const usage = await prisma.issueType.findUnique({
            where: { id },
            include: {
                _count: { select: { sessions: true } }
            }
        });

        if (usage && usage._count.sessions > 0) {
            return NextResponse.json({ error: 'Cannot delete: Issue Type is in use by Chat Sessions' }, { status: 400 });
        }

        await prisma.issueType.delete({ where: { id } });

        return NextResponse.json({ message: 'Issue Type deleted successfully' });
    } catch (error) {
        console.error('Failed to delete issue type:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
