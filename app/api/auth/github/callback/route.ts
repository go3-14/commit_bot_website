import { NextRequest, NextResponse } from 'next/server';
import { getBaseUrl, getGithubCredentials } from '@/lib/env';
import { setSessionCookie } from '@/lib/session';
import { fetchUser } from '@/lib/github-api';

export async function GET(req: NextRequest) {
  const baseUrl = getBaseUrl();
  const fail = (code: string) => NextResponse.redirect(new URL(`/?error=${code}`, baseUrl));

  const code = req.nextUrl.searchParams.get('code');
  if (req.nextUrl.searchParams.get('error')) return fail('access_denied');
  if (!code) return fail('no_code');

  let credentials;
  try {
    credentials = getGithubCredentials();
  } catch {
    return fail('server_configuration_error');
  }

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        code,
        redirect_uri: `${baseUrl}/api/auth/github/callback`,
      }),
    });

    if (!tokenRes.ok) return fail('token_exchange_failed');

    const data = await tokenRes.json();
    if (data.error || typeof data.access_token !== 'string') return fail('auth_failed');

    const user = await fetchUser(data.access_token);

    const response = NextResponse.redirect(new URL('/', baseUrl));
    setSessionCookie(response, data.access_token, user.login);
    return response;
  } catch (err: unknown) {
    console.error('OAuth callback error:', err);
    return fail('internal_auth_error');
  }
}
