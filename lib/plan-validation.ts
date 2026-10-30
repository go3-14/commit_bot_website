import { CommitPlanEntry } from '@/types';

export const MAX_DATES_PER_RUN = 366;
export const MAX_COMMITS_PER_DAY = 20;
export const MAX_COMMITS_PER_RUN = 500;
export const MIN_YEAR = 2008;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const REPO_PATTERN = /^[A-Za-z0-9._-]{1,100}$/;

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

export function isValidRepoName(name: unknown): name is string {
  return typeof name === 'string' && REPO_PATTERN.test(name) && name !== '.' && name !== '..';
}

function isRealUtcDate(value: string): boolean {
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** Validates an untrusted commit plan and merges duplicate dates. */
export function validatePlan(raw: unknown, now: Date = new Date()): ValidationResult<CommitPlanEntry[]> {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { ok: false, error: 'Commit plan is empty or invalid' };
  }
  if (raw.length > MAX_DATES_PER_RUN) {
    return { ok: false, error: `Plan exceeds ${MAX_DATES_PER_RUN} dates` };
  }

  const today = now.toISOString().slice(0, 10);
  const byDate = new Map<string, number>();

  for (const item of raw) {
    if (typeof item !== 'object' || item === null) {
      return { ok: false, error: 'Invalid plan entry' };
    }
    const { date, count } = item as { date?: unknown; count?: unknown };

    if (typeof date !== 'string' || !DATE_PATTERN.test(date) || !isRealUtcDate(date)) {
      return { ok: false, error: 'Plan contains an invalid date' };
    }
    if (date < `${MIN_YEAR}-01-01` || date > today) {
      return { ok: false, error: 'Plan dates must be between 2008 and today' };
    }
    if (typeof count !== 'number' || !Number.isInteger(count) || count < 1 || count > MAX_COMMITS_PER_DAY) {
      return { ok: false, error: `Commits per day must be between 1 and ${MAX_COMMITS_PER_DAY}` };
    }

    byDate.set(date, (byDate.get(date) ?? 0) + count);
  }

  const plan: CommitPlanEntry[] = [];
  let total = 0;
  for (const [date, count] of byDate) {
    if (count > MAX_COMMITS_PER_DAY) {
      return { ok: false, error: `Commits per day must be between 1 and ${MAX_COMMITS_PER_DAY}` };
    }
    total += count;
    plan.push({ date, count });
  }
  if (total > MAX_COMMITS_PER_RUN) {
    return { ok: false, error: `Plan exceeds ${MAX_COMMITS_PER_RUN} commits per run` };
  }

  plan.sort((a, b) => a.date.localeCompare(b.date));
  return { ok: true, value: plan };
}
