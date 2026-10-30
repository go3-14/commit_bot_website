import {
  startOfWeek,
  subWeeks,
  addWeeks,
  addDays,
  startOfDay,
  differenceInWeeks,
  getDay,
} from 'date-fns';
import { GRAPH_WEEKS } from './constants';

/**
 * Get the start date (top-left corner) of the GitHub contribution graph.
 * This is the Sunday of the week that is 52 weeks before the current week.
 *
 * @param referenceDate - The "today" date (defaults to now)
 * @returns The Sunday that starts the contribution graph
 */
export function getGraphStartDate(referenceDate: Date = new Date()): Date {
  // GitHub graph starts on Sunday of the current week, then goes back 52 weeks
  const currentWeekStart = startOfWeek(referenceDate, { weekStartsOn: 0 }); // Sunday
  return subWeeks(currentWeekStart, GRAPH_WEEKS - 1);
}

/**
 * Convert a (week, day) grid coordinate to a calendar date.
 *
 * @param week  - Column index (0 = leftmost/oldest, 52 = rightmost/current)
 * @param day   - Row index (0 = Sunday, 6 = Saturday)
 * @param referenceDate - The "today" date for graph calculation
 * @returns The calendar date for that grid cell
 */
export function gridToDate(
  week: number,
  day: number,
  referenceDate: Date = new Date()
): Date {
  const graphStart = getGraphStartDate(referenceDate);
  return addDays(addWeeks(graphStart, week), day);
}

/**
 * Convert a calendar date to (week, day) grid coordinates.
 *
 * @param date - The calendar date
 * @param referenceDate - The "today" date for graph calculation
 * @returns { week, day } or null if the date is outside the visible graph
 */
export function dateToGrid(
  date: Date,
  referenceDate: Date = new Date()
): { week: number; day: number } | null {
  const graphStart = getGraphStartDate(referenceDate);
  const target = startOfDay(date);

  const day = getDay(target); // 0 = Sunday
  const weeksDiff = differenceInWeeks(
    startOfWeek(target, { weekStartsOn: 0 }),
    graphStart
  );

  if (weeksDiff < 0 || weeksDiff >= GRAPH_WEEKS) {
    return null;
  }

  return { week: weeksDiff, day };
}

/**
 * Get the start date for a specific year's contribution graph.
 * GitHub shows Jan 1 through Dec 31 when viewing a specific year.
 * The grid starts on the Sunday on or before Jan 1.
 *
 * @param year - The target year
 * @returns The Sunday that starts the year's graph
 */
export function getYearGraphStartDate(year: number): Date {
  const jan1 = Date.UTC(year, 0, 1);
  const dayOfWeek = new Date(jan1).getUTCDay();
  return new Date(jan1 - dayOfWeek * 86_400_000);
}

/**
 * Convert a (week, day) coordinate to a UTC calendar date for a specific year's graph.
 *
 * @param week - Column index
 * @param day  - Row index (0 = Sunday, 6 = Saturday)
 * @param year - The target year
 * @returns Date at 00:00 UTC of that calendar day
 */
export function yearGridToDate(week: number, day: number, year: number): Date {
  const start = getYearGraphStartDate(year).getTime();
  return new Date(start + (week * 7 + day) * 86_400_000);
}

/** "YYYY-MM-DD" for a UTC calendar date. */
export function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}
