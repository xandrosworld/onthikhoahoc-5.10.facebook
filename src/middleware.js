import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET || 'dev-secret-change-me-please-0000000');

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('session')?.value;
  let payload = null;
  if (token) {
    try { payload = (await jwtVerify(token, secret())).payload; } catch {}
  }
  if (!payload) {
    const url = req.nextUrl.clone();
    url.pathname = '/dang-nhap';
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith('/admin') && payload.role !== 'ADMIN') {
    const url = req.nextUrl.clone();
    url.pathname = '/khong-co-quyen';
    url.search = '';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/hoc-sinh/:path*', '/admin/:path*', '/lam-bai/:path*'] };
