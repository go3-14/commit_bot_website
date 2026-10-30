/**
 * In-memory limiter. Good enough for a single instance; on multi-instance or serverless
 * deployments replace the Maps with a shared store (for example Vercel KV or Upstash Redis).
 */

const windows = new Map<string, { count: number; resetAt: number }>();
const activeRuns = new Set<string>();

/** Returns true if the request is allowed. */
export function allowRequest(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = windows.get(key);

  if (!entry || entry.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    if (windows.size > 5000) {
      for (const [k, v] of windows) if (v.resetAt <= now) windows.delete(k);
    }
    return true;
  }

  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

/** Only one commit run per user at a time. Returns false if one is already active. */
export function acquireRun(userKey: string): boolean {
  if (activeRuns.has(userKey)) return false;
  activeRuns.add(userKey);
  return true;
}

export function releaseRun(userKey: string): void {
  activeRuns.delete(userKey);
}
