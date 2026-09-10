import { entryInputSchema, type DailyEntry, type EntryInput } from '@/domain/entry';
const entries = new Map<string, DailyEntry>();
export async function findEntry(date: string) { return entries.get(date) ?? null; }
export async function listEntries() { return [...entries.values()].sort((a, b) => b.date.localeCompare(a.date)); }
export async function saveEntry(input: EntryInput, snapshot: DailyEntry['faceSnapshot'], metadata: Pick<DailyEntry, 'createdAt'|'timezoneOffsetMinutes'|'retrospectiveFlag'>) { const valid = entryInputSchema.parse(input); if (entries.has(valid.date)) throw new Error('Duplicate date'); entries.set(valid.date, { ...valid, faceSnapshot: snapshot, ...metadata }); }
export async function replaceEntries(incoming: DailyEntry[], replaceDates: Set<string>) { for (const entry of incoming) { if (!entries.has(entry.date) || replaceDates.has(entry.date)) entries.set(entry.date, entry); } }
