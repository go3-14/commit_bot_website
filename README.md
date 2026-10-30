# commit-bot

Paint your GitHub contribution graph. Pick days on a heatmap (by hand, from text or shapes, from an image, or at random) and the app creates backdated commits in one of your own repositories through the GitHub Git Data API. No local git needed.

## How it works

GitHub's contribution graph uses a commit's author date. For each painted day the server creates a blob, a tree and a commit with a custom `author.date` / `committer.date`, chained on top of the repository's default branch, then fast-forwards the branch ref.

Pipeline per commit: `git/blobs` -> `git/trees` -> `git/commits`, then `git/refs` is advanced (checkpoint every 50 commits and at the end, never forced).

Rules for the graph to update:

- Commits must be on the repository's default branch.
- Forks do not count. Use a repository you own.
- The author email must be verified on your GitHub account (the primary verified email is used).
- GitHub may take a few minutes to refresh the graph.

## Setup

1. Create a GitHub OAuth App at <https://github.com/settings/developers>.
   - Homepage URL: `http://localhost:3000`
   - Callback URL: `http://localhost:3000/api/auth/github/callback`
2. Create `.env.local` (see `.env.example`):

   ```env
   GITHUB_CLIENT_ID=
   GITHUB_CLIENT_SECRET=
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   SESSION_SECRET=   # 32+ chars: node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
   ```

3. Install and run:

   ```bash
   npm install
   npm run dev
   ```

Scripts: `npm run dev`, `npm run build`, `npm run start`, `npm run lint`.

## Deploying

Set the same four environment variables on your host. `NEXT_PUBLIC_BASE_URL` is required in production and must be the exact public origin (for example `https://example.com`); it is used for the OAuth redirect URI and the CSRF origin check. Update the OAuth App callback URL to `https://<your-domain>/api/auth/github/callback`.

The rate limiter is in memory, so it only holds on a single server instance. On serverless or multi-instance hosting, back `lib/rate-limit.ts` with a shared store (Redis, Vercel KV, Upstash).

## Security model

| Area | What is done |
| --- | --- |
| Session | The GitHub token is encrypted with AES-256-GCM (key derived from `SESSION_SECRET`) inside an `httpOnly`, `SameSite=Lax`, `Secure` cookie (`__Host-` prefixed in production). Expires after 8 hours. The browser never sees the token. |
| OAuth | Authorization code flow with a random `state` and PKCE (S256), stored in a short-lived sealed cookie and compared in constant time. The redirect URI comes from `NEXT_PUBLIC_BASE_URL`, never from the Host header. |
| Sign out | POST only, origin checked, and the token is revoked at GitHub. |
| CSRF | State-changing routes require a matching `Origin` header and a JSON content type. |
| Execution limits | The server derives owner, branch and author identity itself. The target must be a repository you own that is not a fork or archived. Plans are validated: real dates between 2008 and today, 1-20 commits per day, at most 366 days and 500 commits per run. One run per user at a time, and a per-user request rate limit. |
| Git safety | Branch updates are fast-forward only (no force push). Closing the tab stops the run and keeps the commits made so far. |
| Browser hardening | Nonce-based CSP (`script-src` with `strict-dynamic`), HSTS, `frame-ancestors 'none'`, `nosniff`, COOP/CORP, strict referrer and permissions policies, `no-store` on API responses. |
| Errors | Clients get generic messages; details are logged server side. Auth error codes in the URL are mapped to fixed messages. |

Known tradeoff: GitHub OAuth Apps can only grant the broad `repo` scope for private repository access, so a leaked token would expose private repositories. Use a dedicated repository, keep the session short, and sign out when finished (this revokes the token). Switching the scope to `public_repo` in `app/api/auth/github/route.ts` limits access to public repositories only.

## Project layout

- `app/` pages and API routes (`api/auth/*`, `api/execute`, `api/repos`, `api/me`)
- `proxy.ts` CSP nonce and header injection
- `lib/session.ts`, `lib/oauth.ts`, `lib/security.ts`, `lib/rate-limit.ts` session, OAuth, CSRF and rate limiting
- `lib/plan-validation.ts`, `lib/commit-executor.ts` plan checks and the Git Data API pipeline
- `lib/core/` grid and date mapping, 5x7 font and pattern engine
- `store/graph-store.ts` painted days, keyed by UTC date
- `components/graph`, `components/tools`, `components/execution` UI
