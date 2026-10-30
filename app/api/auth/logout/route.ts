import { NextRequest, NextResponse } from 'next/server';
import { getBaseUrl } from '@/lib/env';
import { clearSessionCookie } from '@/lib/session';

export async function GET(req: NextRequest) {
  const response = NextResponse.redirect(new URL('/', getBaseUrl()));
  clearSessionCookie(response);
  return response;
}
