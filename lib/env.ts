const isProd = process.env.NODE_ENV === 'production';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getGithubCredentials(): { clientId: string; clientSecret: string } {
  return {
    clientId: required('GITHUB_CLIENT_ID'),
    clientSecret: required('GITHUB_CLIENT_SECRET'),
  };
}

/**
 * Canonical origin of the app. In production it must be configured explicitly so
 * redirect URIs and origin checks never depend on the request Host header.
 */
export function getBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_BASE_URL;
  if (configured) {
    return new URL(configured).origin;
  }
  if (isProd) {
    throw new Error('Missing required environment variable: NEXT_PUBLIC_BASE_URL');
  }
  return 'http://localhost:3000';
}

/** 32 byte key derived from SESSION_SECRET (base64 or hex or raw, min 32 chars). */
export function getSessionSecret(): string {
  const secret = required('SESSION_SECRET');
  if (secret.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters');
  }
  return secret;
}

export const IS_PROD = isProd;
