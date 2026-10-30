import { NextResponse } from 'next/server';
import { getBaseUrl, getGithubCredentials } from '@/lib/env';
import { createTransaction, setTransactionCookie } from '@/lib/oauth';

export async function GET() {
  const baseUrl = getBaseUrl();

  let clientId: string;
  try {
    clientId = getGithubCredentials().clientId;
  } catch {
    return NextResponse.redirect(new URL('/?error=server_configuration_error', baseUrl));
  }

  const { state, verifier, challenge } = createTransaction();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${baseUrl}/api/auth/github/callback`,
    scope: 'repo user:email',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    allow_signup: 'false',
  });

  const response = NextResponse.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`
  );
  setTransactionCookie(response, state, verifier);
  return response;
}
