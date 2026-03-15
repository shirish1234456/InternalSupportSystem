import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const agents = await prisma.agent.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                department: { select: { id: true, name: true } },
                _count: { select: { sessions: true } }
            }
        });

        return NextResponse.json(agents);
    } catch (error) {
        console.error('Failed to fetch agents:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'SuperAdmin') {
            return NextResponse.json({ error: 'Forbidden. SuperAdmin only.' }, { status: 403 });
        }

        const { name, shift, departmentId } = await req.json();

        if (!name || !shift) {
            return NextResponse.json({ error: 'Name and shift are required' }, { status: 400 });
        }

        let existing;
        if (departmentId) {
            existing = await prisma.agent.findFirst({
                where: { name, departmentId }
            });
        } else {
            existing = await prisma.agent.findFirst({
                // @ts-ignore: Prisma types are out of sync due to file lock
                where: { name, departmentId: null }
            });
        }

        if (existing) {
            return NextResponse.json({ error: 'Agent with this name already exists in this department (or without department)' }, { status: 409 });
        }

        const agent = await prisma.agent.create({
            data: { name, shift, departmentId: departmentId || null }
        });

        return NextResponse.json(agent, { status: 201 });
    } catch (error) {
        console.error('Failed to create agent:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'SuperAdmin') {
            return NextResponse.json({ error: 'Forbidden. SuperAdmin only.' }, { status: 403 });
        }

        const { id, name, shift, departmentId } = await req.json();

        if (!id || !name || !shift) {
            return NextResponse.json({ error: 'ID, name, and shift are required' }, { status: 400 });
        }

        const agent = await prisma.agent.update({
            where: { id },
            data: { name, shift, departmentId: departmentId || null }
        });

        return NextResponse.json(agent);
    } catch (error) {
        console.error('Failed to update agent:', error);
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

        const usage = await prisma.agent.findUnique({
            where: { id },
            include: {
                _count: { select: { sessions: true } }
            }
        });

        if (usage && usage._count.sessions > 0) {
            return NextResponse.json({ error: 'Cannot delete: Agent is in use by Chat Sessions' }, { status: 400 });
        }

        await prisma.agent.delete({ where: { id } });

        return NextResponse.json({ message: 'Agent deleted successfully' });
    } catch (error) {
        console.error('Failed to delete agent:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
