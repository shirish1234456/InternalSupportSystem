import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import { getRateLimiter } from '@/lib/rate-limit';

const loginLimiter = getRateLimiter('login');
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(req: Request) {
  try {
    // ✅ Rate limiting — check before doing any DB work
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown';

    const rateCheck = loginLimiter.check(ip, { max: LOGIN_MAX_ATTEMPTS, windowMs: LOGIN_WINDOW_MS });
    if (!rateCheck.allowed) {
      const retryAfterSec = Math.ceil(rateCheck.retryAfterMs / 1000);
      return NextResponse.json(
        { error: `Too many login attempts. Please try again in ${Math.ceil(retryAfterSec / 60)} minute(s).` },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfterSec) }
        }
      );
    }

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
      // Don't reset limiter on bad password — let the count accumulate
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // ✅ Successful login — reset the rate limiter for this IP
    loginLimiter.reset(ip);

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
      maxAge: 60 * 60 * 24 * 3, // 72 hours (3 days)
    });

    return response;
  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
