import { NextRequest, NextResponse } from 'next/server';
import { getBaseUrl, getGithubCredentials } from '@/lib/env';
import { clearSessionCookie, getSessionFromRequest } from '@/lib/session';
import { rejectCrossOrigin } from '@/lib/security';

async function revokeGrant(token: string): Promise<void> {
  const { clientId, clientSecret } = getGithubCredentials();
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  await fetch(`https://api.github.com/applications/${clientId}/token`, {
    method: 'DELETE',
    headers: {
      Authorization: `Basic ${basic}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ access_token: token }),
  });
}

export async function POST(req: NextRequest) {
  const blocked = rejectCrossOrigin(req);
  if (blocked) return blocked;

  const session = getSessionFromRequest(req);
  if (session) {
    try {
      await revokeGrant(session.token);
    } catch (err: unknown) {
      console.error('Token revocation failed:', err);
    }
  }

  // 303 so the browser follows the redirect with GET
  const response = NextResponse.redirect(new URL('/', getBaseUrl()), 303);
  clearSessionCookie(response);
  return response;
}
