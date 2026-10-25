import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const token = req.cookies.get('gh_token')?.value;

  if (!token && req.nextUrl.pathname.startsWith('/dashboard')) {
    const loginUrl = new URL('/', req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
