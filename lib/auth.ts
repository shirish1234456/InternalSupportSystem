import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

function getSecretKey(): Uint8Array {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error(
      '[Security] JWT_SECRET environment variable is not set. ' +
      'Set a long, random secret in your .env file or deployment environment before running the application.'
    );
  }
  return new TextEncoder().encode(jwtSecret);
}

export interface JWTPayload {
  id: string;
  email: string;
  role: 'SuperAdmin' | 'Admin' | 'DataEntry';
  fullName: string;
  accentColor?: string;
}

export async function signToken(payload: JWTPayload) {
  return await new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h') // Token expires in 24 hours
    .sign(getSecretKey());
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as JWTPayload;
  } catch (error) {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) return null;

  return await verifyToken(token);
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
}
