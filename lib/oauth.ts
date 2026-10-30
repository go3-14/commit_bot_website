import crypto from 'node:crypto';
import type { NextResponse } from 'next/server';
import { IS_PROD } from '@/lib/env';
import { seal, unseal } from '@/lib/session';

export const OAUTH_COOKIE = IS_PROD ? '__Host-oauth' : 'oauth';
const OAUTH_TTL_SECONDS = 60 * 10;

interface OAuthTransaction {
  state: string;
  verifier: string;
  exp: number;
}

export function createTransaction(): { state: string; verifier: string; challenge: string } {
  const state = crypto.randomBytes(32).toString('base64url');
  const verifier = crypto.randomBytes(48).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  return { state, verifier, challenge };
}

export function setTransactionCookie(res: NextResponse, state: string, verifier: string): void {
  const tx: OAuthTransaction = {
    state,
    verifier,
    exp: Math.floor(Date.now() / 1000) + OAUTH_TTL_SECONDS,
  };
  res.cookies.set(OAUTH_COOKIE, seal(tx), {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    maxAge: OAUTH_TTL_SECONDS,
    path: '/',
  });
}

export function clearTransactionCookie(res: NextResponse): void {
  res.cookies.set(OAUTH_COOKIE, '', {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

/** Returns the PKCE verifier if the callback state matches the stored transaction. */
export function consumeTransaction(cookieValue: string | undefined, returnedState: string | null): string | null {
  if (!cookieValue || !returnedState) return null;
  const tx = unseal<OAuthTransaction>(cookieValue);
  if (!tx || typeof tx.state !== 'string' || typeof tx.verifier !== 'string') return null;
  if (tx.exp < Math.floor(Date.now() / 1000)) return null;

  const a = Buffer.from(tx.state);
  const b = Buffer.from(returnedState);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return tx.verifier;
}
