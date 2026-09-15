import { dailyEntrySchema, entryInputSchema, type DailyEntry, type EntryInput } from '@/domain/entry';

const entries = new Map<string, DailyEntry>();

export async function findEntry(date: string) {
  return entries.get(date) ?? null;
}

export async function listEntries() {
  return [...entries.values()].sort((a, b) => b.date.localeCompare(a.date));
}

export async function saveEntry(
  input: EntryInput,
  snapshot: DailyEntry['faceSnapshot'],
  metadata: Pick<DailyEntry, 'createdAt' | 'timezoneOffsetMinutes' | 'retrospectiveFlag'>,
) {
  const validInput = entryInputSchema.parse(input);
  if (entries.has(validInput.date)) throw new Error('Duplicate date');
  const entry = dailyEntrySchema.parse({ ...validInput, faceSnapshot: snapshot, ...metadata });
  entries.set(entry.date, entry);
}

export async function replaceEntries(incoming: DailyEntry[], replaceDates: Set<string>) {
  const validEntries = dailyEntrySchema.array().parse(incoming);
  const batchDates = new Set<string>();
  for (const entry of validEntries) {
    if (batchDates.has(entry.date)) throw new Error(`Duplicate date in restore batch: ${entry.date}`);
    batchDates.add(entry.date);
  }
  for (const entry of validEntries) {
    if (!entries.has(entry.date) || replaceDates.has(entry.date)) entries.set(entry.date, entry);
  }
}
