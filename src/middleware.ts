import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

const PUBLIC_ROUTES = ['/', '/login', '/register'];
const INVITE_ROUTE = /^\/invite\/.+/;
const ADMIN_ONLY_ROUTES = [
  '/dashboard/departments',
  '/dashboard/ats-connection',
  '/dashboard/ats-browser',
  '/dashboard/settings/team',
  '/dashboard/settings/workspace',
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Allow public routes and invite links
  if (PUBLIC_ROUTES.includes(pathname) || INVITE_ROUTE.test(pathname)) {
    if (session && (pathname === '/login' || pathname === '/register')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  }

  // Require auth for everything else
  if (!session) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = (session.user as any)?.role;

  // Block recruiters from admin-only routes
  if (role === 'recruiter' && ADMIN_ONLY_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
};
