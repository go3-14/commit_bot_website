import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import type { NextRequest, NextResponse } from 'next/server';
import { getSessionSecret, IS_PROD } from '@/lib/env';

export const SESSION_COOKIE = IS_PROD ? '__Host-session' : 'session';
export const SESSION_TTL_SECONDS = 60 * 60 * 8;

export interface Session {
  token: string;
  login: string;
  exp: number; // unix seconds
}

function deriveKey(): Buffer {
  return crypto.createHash('sha256').update(getSessionSecret()).digest();
}

/** AES-256-GCM seal. Output: base64url(iv | tag | ciphertext). */
export function seal(payload: object): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', deriveKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString('base64url');
}

export function unseal<T>(value: string): T | null {
  try {
    const raw = Buffer.from(value, 'base64url');
    if (raw.length < 12 + 16 + 1) return null;
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const ciphertext = raw.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', deriveKey(), iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return JSON.parse(plain.toString('utf8')) as T;
  } catch {
    return null;
  }
}

function parseSession(value: string | undefined): Session | null {
  if (!value) return null;
  const session = unseal<Session>(value);
  if (
    !session ||
    typeof session.token !== 'string' ||
    typeof session.login !== 'string' ||
    typeof session.exp !== 'number' ||
    session.exp < Math.floor(Date.now() / 1000)
  ) {
    return null;
  }
  return session;
}

/** For server components. */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return parseSession(store.get(SESSION_COOKIE)?.value);
}

/** For route handlers. */
export function getSessionFromRequest(req: NextRequest): Session | null {
  return parseSession(req.cookies.get(SESSION_COOKIE)?.value);
}

export function setSessionCookie(res: NextResponse, token: string, login: string): void {
  const session: Session = {
    token,
    login,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  res.cookies.set(SESSION_COOKIE, seal(session), {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    maxAge: SESSION_TTL_SECONDS,
    path: '/',
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}
