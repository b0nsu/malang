import type { DailyEntry } from './entry';
import { localDateString } from './entry';

export type GraphPoint = Pick<DailyEntry, 'date' | 'value'>;
export type GraphSegment = GraphPoint[];
export type GraphRange = 'week' | 'month' | 'year' | 'all';

export function filterEntriesByRange(entries: DailyEntry[], range: GraphRange, today = new Date()): DailyEntry[] {
  if (range === 'all') return entries;
  let start = new Date(today);
  if (range === 'week') start.setDate(start.getDate() - 6);
  if (range === 'month') start = shiftMonthsClamped(start, -1);
  if (range === 'year') start = shiftYearsClamped(start, -1);
  const startDate = localDateString(start);
  const endDate = localDateString(today);
  return entries.filter((entry) => entry.date >= startDate && entry.date <= endDate);
}

/** Values are intentionally sparse: a missing value breaks a visual segment. */
export function buildGraphSegments(entries: DailyEntry[]): GraphSegment[] {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const segments: GraphSegment[] = [];
  let current: GraphSegment = [];
  for (const entry of sorted) {
    if (entry.value === null) {
      if (current.length) segments.push(current);
      current = [];
      continue;
    }
    if (current.length && dayDistance(current.at(-1)!.date, entry.date) !== 1) {
      segments.push(current);
      current = [];
    }
    current.push({ date: entry.date, value: entry.value });
  }
  if (current.length) segments.push(current);
  return segments;
}

function shiftMonthsClamped(date: Date, months: number) {
  const result = new Date(date);
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  result.setDate(Math.min(day, daysInMonth(result.getFullYear(), result.getMonth())));
  return result;
}

function shiftYearsClamped(date: Date, years: number) {
  const result = new Date(date);
  const day = result.getDate();
  result.setDate(1);
  result.setFullYear(result.getFullYear() + years);
  result.setDate(Math.min(day, daysInMonth(result.getFullYear(), result.getMonth())));
  return result;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function dayDistance(a: string, b: string) {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}
