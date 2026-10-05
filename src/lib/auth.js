import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from './db';

const COOKIE = 'session';
const MAX_AGE = 60 * 60 * 24 * 14;
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET || 'dev-secret-change-me-please-0000000');

export async function createSession(user) {
  const token = await new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production' && (process.env.SITE_URL || '').startsWith('https'),
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).set(COOKIE, '', { path: '/', maxAge: 0 });
}

export async function getUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const user = await db.user.findUnique({ where: { id: payload.sub }, include: { profile: true } });
    if (!user || user.status !== 'ACTIVE') return null;
    return user;
  } catch {
    return null;
  }
}

export async function requireUser(next = '/hoc-sinh') {
  const user = await getUser();
  if (!user) redirect(`/dang-nhap?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireAdmin() {
  const user = await getUser();
  if (!user) redirect('/dang-nhap?next=/admin');
  if (user.role !== 'ADMIN') redirect('/khong-co-quyen');
  return user;
}

/** Dùng trong API route: trả về user hoặc null */
export async function apiUser() {
  return getUser();
}
