import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

// Define paths that do not require authentication
const publicPaths = ['/login', '/api/auth/login'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Static assets and internal next paths are usually skipped by matcher, but just in case
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon.ico') ||
        pathname.startsWith('/public')
    ) {
        return NextResponse.next();
    }

    const isPublicPath = publicPaths.some(p => pathname.startsWith(p));
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
        if (!isPublicPath) {
            // Redirect to login if accessing protected route without a token
            if (pathname.startsWith('/api/')) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            return NextResponse.redirect(new URL('/login', request.url));
        }
        return NextResponse.next();
    }

    // Verify the token
    const payload = await verifyToken(token);

    if (!payload) {
        if (!isPublicPath) {
            // Token is invalid/expired
            if (pathname.startsWith('/api/')) {
                return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
            }
            // Redirect to login and clear the invalid cookie
            const response = NextResponse.redirect(new URL('/login', request.url));
            response.cookies.delete('auth_token');
            return response;
        }
        return NextResponse.next();
    }

    // Redirect to dashboard if trying to access login page while authenticated
    if (isPublicPath && pathname === '/login') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Pass user details to headers for downstream access (optional but useful)
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.id);
    requestHeaders.set('x-user-role', payload.role);

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}

export const config = {
    matcher: ['/((?!api/auth/login|_next/static|_next/image|favicon.ico).*)'],
};
