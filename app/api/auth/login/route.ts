import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Invalid credentials or inactive user' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Generate JWT Token using `jose`
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      accentColor: (user as any).accentColor || 'blue',
    };

    const token = await signToken(payload);

    // Create response
    const response = NextResponse.json({
      message: 'Login successful',
      user: payload,
    });

    // Set Secure HttpOnly Cookie
    const isProd = process.env.NODE_ENV === 'production';
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}