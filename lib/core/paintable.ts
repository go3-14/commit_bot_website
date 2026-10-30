import { MIN_YEAR } from '@/lib/plan-validation';

/** True if a commit can be queued for this UTC date: inside the viewed year, 2008 or later, and not in the future. */
export function isPaintableDate(date: Date, year: number, now: Date = new Date()): boolean {
  if (date.getUTCFullYear() !== year || year < MIN_YEAR) return false;
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return date.getTime() <= todayUtc;
}
