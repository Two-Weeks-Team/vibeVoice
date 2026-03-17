import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const password = (body as Record<string, unknown>).password;

  const correctPassword = process.env.AUTH_PASSWORD;
  if (!correctPassword) {
    return NextResponse.json({ error: 'Auth not configured' }, { status: 500 });
  }

  if (!password || password !== correctPassword) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set('vv-session', 'authenticated', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
  return response;
}
