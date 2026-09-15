import type { DailyEntry } from './entry';
import { localDateString } from './entry';

export type GraphPoint = Pick<DailyEntry, 'date' | 'value'>;
export type GraphSegment = GraphPoint[];
export type GraphRange = 'week' | 'month' | 'year' | 'all';

export function filterEntriesByRange(entries: DailyEntry[], range: GraphRange, today = new Date()): DailyEntry[] {
  if (range === 'all') return entries;
  const start = new Date(today);
  if (range === 'week') start.setDate(start.getDate() - 6);
  if (range === 'month') start.setMonth(start.getMonth() - 1);
  if (range === 'year') start.setFullYear(start.getFullYear() - 1);
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

function dayDistance(a: string, b: string) {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}
