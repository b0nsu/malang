import { z } from 'zod';
import type { DailyEntry } from './entry';
import type { FaceSnapshotV1 } from './entry';
import { faceParametersSchema } from './face';

export type MalangAppearance = FaceSnapshotV1['appearance'];
export type BackupV1 = { schemaVersion: 1; exportedAt: string; appVersion: string; appearance: MalangAppearance; entries: DailyEntry[]; checksum: string };
export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;
const faceSchema = z.object({ version: z.literal(1), parameters: faceParametersSchema, appearance: z.object({ baseColor: z.string().min(1), materialId: z.string().min(1), decorationIds: z.array(z.string().min(1)) }) });
export const backupSchema = z.object({
  schemaVersion: z.literal(1),
  exportedAt: z.iso.datetime({ offset: true }),
  appVersion: z.string().min(1),
  appearance: faceSchema.shape.appearance,
  entries: z.array(z.object({
    date: z.iso.date(),
    emotionId: z.string().min(1),
    value: z.number().int().min(-20).max(20).nullable(),
    note: z.string().max(120).refine((note) => !/[\r\n\u2028\u2029]/.test(note), 'Note must be single-line').nullable(),
    faceSnapshot: faceSchema,
    createdAt: z.iso.datetime({ offset: true }),
    timezoneOffsetMinutes: z.number().int().min(-840).max(840),
    retrospectiveFlag: z.boolean(),
  })).superRefine((entries, context) => {
    const dates = new Set<string>();
    entries.forEach((entry, index) => {
      if (dates.has(entry.date)) context.addIssue({ code: 'custom', message: 'Duplicate backup date.', path: [index, 'date'] });
      dates.add(entry.date);
    });
  }),
  checksum: z.string().regex(/^[0-9a-f]{8}$/),
});

export function assertBackupFileSize(size: unknown): asserts size is number {
  if (typeof size !== 'number' || !Number.isSafeInteger(size) || size <= 0 || size > MAX_BACKUP_BYTES) throw new Error('Invalid backup file size.');
}

export function parseBackupText(text: string): BackupV1 {
  assertBackupFileSize(text.length);
  let bytes = 0;
  for (const char of text) {
    const point = char.codePointAt(0)!;
    bytes += point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4;
    if (bytes > MAX_BACKUP_BYTES) throw new Error('Invalid backup file size.');
  }
  return parseBackup(JSON.parse(text));
}

export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value as object).sort().map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
/** Lightweight integrity check, not encryption or a security signature. */
export function checksum(value: Omit<BackupV1, 'checksum'>): string {
  let hash = 0x811c9dc5;
  for (const char of stableStringify(value)) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 0x01000193); }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
export function createBackup(entries: DailyEntry[], appearance: MalangAppearance, appVersion = '1.0.0'): BackupV1 {
  const payload = { schemaVersion: 1 as const, exportedAt: new Date().toISOString(), appVersion, appearance, entries };
  return { ...payload, checksum: checksum(payload) };
}
export function parseBackup(input: unknown): BackupV1 {
  const backup = backupSchema.parse(input);
  if (checksum({ schemaVersion: backup.schemaVersion, exportedAt: backup.exportedAt, appVersion: backup.appVersion, appearance: backup.appearance, entries: backup.entries }) !== backup.checksum) throw new Error('Backup checksum does not match.');
  return backup;
}

export type ImportPreview = { additions: DailyEntry[]; collisions: DailyEntry[] };
export function previewImport(backup: BackupV1, existingDates: Iterable<string>): ImportPreview {
  const dates = new Set(existingDates);
  return { additions: backup.entries.filter((entry) => !dates.has(entry.date)), collisions: backup.entries.filter((entry) => dates.has(entry.date)) };
}
