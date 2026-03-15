import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/auth';



export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== 'SuperAdmin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error('Failed to fetch users:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'SuperAdmin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { fullName, email, password, role } = await req.json();

        if (!fullName || !email || !password || !role) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                fullName,
                email,
                passwordHash,
                role,
            },
            select: { id: true, fullName: true, email: true, role: true, isActive: true }
        });

        return NextResponse.json(user, { status: 201 });
    } catch (error) {
        console.error('Failed to create user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'SuperAdmin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id, fullName, email, role, isActive, password } = await req.json();

        if (!id || !fullName || !email || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const updateData: any = {
            fullName,
            email,
            role,
            isActive: Boolean(isActive)
        };

        if (password) {
            updateData.passwordHash = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            select: { id: true, fullName: true, email: true, role: true, isActive: true }
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error('Failed to update user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
