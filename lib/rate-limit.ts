/**
 * Lightweight, in-memory rate limiter for Next.js API routes.
 * Tracks failed attempts per IP.  No external deps required.
 *
 * Usage:
 *   const limiter = getRateLimiter('login');
 *   const result = limiter.check(ip, { max: 5, windowMs: 15 * 60 * 1000 });
 *   if (!result.allowed) return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });
 *   // on success:
 *   limiter.reset(ip);
 */

interface AttemptRecord {
    count: number;
    firstAttemptAt: number;
}

class RateLimiter {
    private store = new Map<string, AttemptRecord>();

    /** Returns whether the request is allowed and how many attempts remain. */
    check(key: string, options: { max: number; windowMs: number }): { allowed: boolean; remaining: number; retryAfterMs: number } {
        const now = Date.now();
        const record = this.store.get(key);

        if (!record || now - record.firstAttemptAt > options.windowMs) {
            // First attempt or window expired — reset
            this.store.set(key, { count: 1, firstAttemptAt: now });
            return { allowed: true, remaining: options.max - 1, retryAfterMs: 0 };
        }

        if (record.count >= options.max) {
            const retryAfterMs = options.windowMs - (now - record.firstAttemptAt);
            return { allowed: false, remaining: 0, retryAfterMs };
        }

        record.count += 1;
        return { allowed: true, remaining: options.max - record.count, retryAfterMs: 0 };
    }

    /** Reset the counter for a key (call on successful auth). */
    reset(key: string): void {
        this.store.delete(key);
    }
}

// Keep a singleton per limiter name so state persists across requests in the same process.
const limiters = new Map<string, RateLimiter>();

export function getRateLimiter(name: string): RateLimiter {
    if (!limiters.has(name)) {
        limiters.set(name, new RateLimiter());
    }
    return limiters.get(name)!;
}
