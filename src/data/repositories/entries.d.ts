import type { DailyEntry, EntryInput } from '@/domain/entry';
export declare function findEntry(date: string): Promise<DailyEntry | null>;
export declare function listEntries(): Promise<DailyEntry[]>;
export declare function saveEntry(input: EntryInput, snapshot: DailyEntry['faceSnapshot'], metadata: Pick<DailyEntry, 'createdAt'|'timezoneOffsetMinutes'|'retrospectiveFlag'>): Promise<void>;
export declare function replaceEntries(entries: DailyEntry[], replaceDates: Set<string>): Promise<void>;
