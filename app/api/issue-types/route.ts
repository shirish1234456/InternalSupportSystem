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
        const singleId = url.searchParams.get('id');

        let idsToDelete: string[] = [];
        try {
            const body = await req.json();
            if (body && Array.isArray(body.ids) && body.ids.length > 0) {
                idsToDelete = body.ids;
            }
        } catch (e) { }

        if (idsToDelete.length === 0 && singleId) {
            idsToDelete = [singleId];
        }

        if (idsToDelete.length === 0) {
            return NextResponse.json({ error: 'ID(s) are required' }, { status: 400 });
        }

        // Nullify issueTypeId on linked sessions first, then delete — in a transaction
        await prisma.$transaction([
            prisma.chatSession.updateMany({
                where: { issueTypeId: { in: idsToDelete } },
                data: { issueTypeId: null }
            }),
            prisma.issueType.deleteMany({ where: { id: { in: idsToDelete } } })
        ]);

        return NextResponse.json({ message: 'Issue Type(s) deleted successfully' });
    } catch (error) {
        console.error('Failed to delete issue type(s):', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
