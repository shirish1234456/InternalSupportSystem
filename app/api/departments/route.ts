import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';



// Get all Departments
export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const departments = await prisma.department.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { agents: true, sessions: true }
                }
            }
        });

        return NextResponse.json(departments);
    } catch (error) {
        console.error('Failed to fetch departments:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// Create a new Department
export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'SuperAdmin') {
            return NextResponse.json({ error: 'Forbidden. SuperAdmin only.' }, { status: 403 });
        }

        const { name } = await req.json();

        if (!name) {
            return NextResponse.json({ error: 'Department name is required' }, { status: 400 });
        }

        // Check if exists
        const existing = await prisma.department.findUnique({
            where: { name }
        });

        if (existing) {
            return NextResponse.json({ error: 'Department with this name already exists' }, { status: 409 });
        }

        const department = await prisma.department.create({
            data: { name }
        });

        return NextResponse.json(department, { status: 201 });
    } catch (error) {
        console.error('Failed to create department:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// Update a Department (using PATCH or PUT, assuming PUT here for simplicity)
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

        const department = await prisma.department.update({
            where: { id },
            data: { name }
        });

        return NextResponse.json(department);
    } catch (error) {
        console.error('Failed to update department:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// Delete a Department
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

        // Check for related records before deleting (prevent violating foreign key constraints)
        const usage = await prisma.department.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { agents: true, sessions: true }
                }
            }
        });

        if (usage && (usage._count.agents > 0 || usage._count.sessions > 0)) {
            return NextResponse.json({ error: 'Cannot delete: Department is in use by Agents or Sessions' }, { status: 400 });
        }

        await prisma.department.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Department deleted successfully' });
    } catch (error) {
        console.error('Failed to delete department:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
