import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';



// Get all Query Types
export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const queryTypes = await prisma.queryType.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { sessions: true }
                }
            }
        });

        return NextResponse.json(queryTypes);
    } catch (error) {
        console.error('Failed to fetch query types:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// Create a new Query Type
export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'SuperAdmin') {
            return NextResponse.json({ error: 'Forbidden. SuperAdmin only.' }, { status: 403 });
        }

        const { name } = await req.json();

        if (!name) {
            return NextResponse.json({ error: 'Query Type name is required' }, { status: 400 });
        }

        // Check if exists
        const existing = await prisma.queryType.findUnique({
            where: { name }
        });

        if (existing) {
            return NextResponse.json({ error: 'Query Type with this name already exists' }, { status: 409 });
        }

        const queryType = await prisma.queryType.create({
            data: { name }
        });

        return NextResponse.json(queryType, { status: 201 });
    } catch (error) {
        console.error('Failed to create query type:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// Update a Query Type
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

        const queryType = await prisma.queryType.update({
            where: { id },
            data: { name }
        });

        return NextResponse.json(queryType);
    } catch (error) {
        console.error('Failed to update query type:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// Delete a Query Type
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

        // Check for related records
        const usage = await prisma.queryType.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { sessions: true }
                }
            }
        });

        if (usage && usage._count.sessions > 0) {
            return NextResponse.json({ error: 'Cannot delete: Query Type is in use by Chat Sessions' }, { status: 400 });
        }

        await prisma.queryType.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Query Type deleted successfully' });
    } catch (error) {
        console.error('Failed to delete query type:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
