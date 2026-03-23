import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, signToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.id },
            select: {
                fullName: true,
                email: true,
                role: true,
                accentColor: true,
                dashboardLayout: true,
            } as any
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Failed to fetch profile:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, fullName, currentPassword, newPassword } = await req.json();

        const user = await prisma.user.findUnique({
            where: { id: session.id }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (action === 'update_profile') {
            if (!fullName || fullName.trim() === '') {
                return NextResponse.json({ error: 'Full Name is required' }, { status: 400 });
            }

            const updatedUser = await prisma.user.update({
                where: { id: session.id },
                data: { fullName: fullName.trim() }
            });

            // We must update the JWT cookie so the Sidebar immediately reflects the new name!
            const newPayload = {
                id: updatedUser.id,
                email: updatedUser.email,
                role: updatedUser.role,
                fullName: updatedUser.fullName,
                accentColor: (updatedUser as any).accentColor || 'blue',
            };

            const token = await signToken(newPayload);
            const response = NextResponse.json({ message: 'Profile updated successfully', user: newPayload });

            response.cookies.set('auth_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24, // 24 hours
            });

            return response;
        }

        if (action === 'update_theme') {
            const { accentColor } = await req.json();

            const updatedUser = await (prisma.user as any).update({
                where: { id: session.id },
                data: { accentColor }
            });

            // Update JWT to reflect theme instantly on hard reloads
            const newPayload = {
                id: updatedUser.id,
                email: updatedUser.email,
                role: updatedUser.role,
                fullName: updatedUser.fullName,
                accentColor: (updatedUser as any).accentColor || 'blue',
            };

            const token = await signToken(newPayload);
            const response = NextResponse.json({ message: 'Theme updated successfully', user: newPayload });

            response.cookies.set('auth_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24, // 24 hours
            });

            return response;
        }

        if (action === 'update_layout') {
            const { dashboardLayout } = await req.json();

            await (prisma.user as any).update({
                where: { id: session.id },
                data: { dashboardLayout: JSON.stringify(dashboardLayout) }
            });

            return NextResponse.json({ message: 'Layout updated successfully' });
        }

        if (action === 'update_password') {
            if (!currentPassword || !newPassword) {
                return NextResponse.json({ error: 'Current and new passwords are required' }, { status: 400 });
            }

            if (newPassword.length < 8) {
                return NextResponse.json({ error: 'New password must be at least 8 characters long' }, { status: 400 });
            }

            const user = await prisma.user.findUnique({
                where: { id: session.id }
            });

            if (!user) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }

            // Verify current password
            const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!isValid) {
                return NextResponse.json({ error: 'Incorrect current password' }, { status: 401 });
            }

            // Hash and update new password
            const passwordHash = await bcrypt.hash(newPassword, 10);
            await prisma.user.update({
                where: { id: session.id },
                data: { passwordHash }
            });

            return NextResponse.json({ message: 'Password updated successfully' });
        }
    } catch (error) {
        console.error('Failed to update password:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
