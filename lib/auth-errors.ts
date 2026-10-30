const AUTH_ERRORS: Record<string, string> = {
  access_denied: 'GitHub sign-in was cancelled.',
  no_code: 'GitHub did not return a sign-in code. Try again.',
  invalid_state: 'Sign-in session expired or did not match. Try again.',
  token_exchange_failed: 'Could not complete sign-in with GitHub.',
  auth_failed: 'Could not complete sign-in with GitHub.',
  internal_auth_error: 'Something went wrong during sign-in.',
  server_configuration_error: 'Sign-in is not configured on this server.',
};

/** Maps an untrusted ?error= value to a fixed message. Unknown values are ignored. */
export function authErrorMessage(code: string | string[] | undefined): string | null {
  if (typeof code !== 'string') return null;
  return Object.prototype.hasOwnProperty.call(AUTH_ERRORS, code) ? AUTH_ERRORS[code] : null;
}
