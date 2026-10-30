import { NextRequest, NextResponse } from 'next/server';
import { getBaseUrl } from '@/lib/env';

/**
 * CSRF guard for state-changing routes. Requires an Origin header that matches the
 * configured app origin. Browsers always send Origin on cross-site POSTs.
 */
export function rejectCrossOrigin(req: NextRequest): NextResponse | null {
  const origin = req.headers.get('origin');
  if (!origin || origin !== getBaseUrl()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

export function requireJson(req: NextRequest): NextResponse | null {
  const type = req.headers.get('content-type') ?? '';
  if (!type.toLowerCase().startsWith('application/json')) {
    return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 415 });
  }
  return null;
}
