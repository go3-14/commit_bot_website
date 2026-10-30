import type { ContributionDay } from '@/types';

export interface YearInsights {
  total: number;
  activeDays: number;
  currentStreak: number;
  longestStreak: number;
  busiest: { date: string; count: number } | null;
  months: number[]; // contributions per month, index 0 = january
}

const DAY_MS = 86_400_000;

function previousDay(date: string): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) - DAY_MS).toISOString().slice(0, 10);
}

/**
 * Summaries for one year of GitHub contribution data. The current streak counts back from
 * today (or yesterday, if today has no contributions yet) and is 0 for years that are over.
 */
export function computeInsights(
  weeks: ContributionDay[][],
  year: number,
  now: Date = new Date()
): YearInsights {
  const counts = new Map<string, number>();
  for (const week of weeks) {
    for (const day of week) {
      if (day.date.startsWith(`${year}-`)) counts.set(day.date, day.contributionCount);
    }
  }

  const dates = [...counts.keys()].sort();
  const months = Array<number>(12).fill(0);
  let total = 0;
  let activeDays = 0;
  let longestStreak = 0;
  let run = 0;
  let busiest: YearInsights['busiest'] = null;
  let previous: string | null = null;

  for (const date of dates) {
    const count = counts.get(date) ?? 0;
    total += count;
    months[Number(date.slice(5, 7)) - 1] += count;

    if (count > 0) {
      activeDays++;
      run = previous !== null && previousDay(date) === previous && (counts.get(previous) ?? 0) > 0 ? run + 1 : 1;
      longestStreak = Math.max(longestStreak, run);
      if (!busiest || count > busiest.count) busiest = { date, count };
    } else {
      run = 0;
    }
    previous = date;
  }

  let currentStreak = 0;
  const today = now.toISOString().slice(0, 10);
  if (today.startsWith(`${year}-`)) {
    let cursor = (counts.get(today) ?? 0) > 0 ? today : previousDay(today);
    while ((counts.get(cursor) ?? 0) > 0) {
      currentStreak++;
      cursor = previousDay(cursor);
    }
  }

  return { total, activeDays, currentStreak, longestStreak, busiest, months };
}
