import { NextRequest, NextResponse } from 'next/server';

// '/api/internal' is bypassed here because those routes enforce their own
// x-api-key (INTERNAL_API_KEY) auth — not the cookie session. See api/internal/*.
const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout', '/api/internal'];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const session = req.cookies.get('vv-session')?.value;
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
