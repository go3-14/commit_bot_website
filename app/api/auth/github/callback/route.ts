import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const errorParam = req.nextUrl.searchParams.get('error');

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;

  if (errorParam) {
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(errorParam)}`, baseUrl));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', baseUrl));
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/?error=server_configuration_error', baseUrl));
  }

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(new URL('/?error=token_exchange_failed', baseUrl));
    }

    const data = await tokenRes.json();

    if (data.error || !data.access_token) {
      const errorMsg = data.error_description || data.error || 'auth_failed';
      return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(errorMsg)}`, baseUrl));
    }

    const response = NextResponse.redirect(new URL('/dashboard', baseUrl));
    
    // Set secure httpOnly cookie
    response.cookies.set('gh_token', data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
    });

    return response;
  } catch (err: unknown) {
    console.error('OAuth callback error:', err);
    return NextResponse.redirect(new URL('/?error=internal_auth_error', baseUrl));
  }
}
