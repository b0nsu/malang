import { z } from 'zod';
import { appearanceSchema, dailyEntrySchema, type DailyEntry, type FaceSnapshotV1 } from './entry';

export const BACKUP_FORMAT = 'malang-backup' as const;
export const BACKUP_SCHEMA_VERSION = 2 as const;
export const MAX_BACKUP_ENTRIES = 36_600;

export type MalangAppearance = FaceSnapshotV1['appearance'];

const timestampSchema = z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'Timestamp must be parseable.');
const checksumSchema = z.string().regex(/^[0-9a-f]{8}$/i);
const entriesSchema = z.array(dailyEntrySchema).max(MAX_BACKUP_ENTRIES);

const backupV1Schema = z.object({
  schemaVersion: z.literal(1),
  exportedAt: timestampSchema,
  appVersion: z.string().min(1).max(64),
  appearance: appearanceSchema,
  entries: entriesSchema,
  checksum: checksumSchema,
}).strict();

const backupV2Schema = z.object({
  format: z.literal(BACKUP_FORMAT),
  schemaVersion: z.literal(BACKUP_SCHEMA_VERSION),
  exportedAt: timestampSchema,
  appVersion: z.string().min(1).max(64),
  appearance: appearanceSchema,
  entries: entriesSchema,
  checksum: checksumSchema,
}).strict();

export type BackupV1 = z.infer<typeof backupV1Schema>;
export type BackupV2 = z.infer<typeof backupV2Schema>;
export type Backup = BackupV2;

export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`).join(',')}}`;
  }
  const encoded = JSON.stringify(value);
  if (encoded === undefined) throw new Error('Backup contains an unsupported value.');
  return encoded;
}

/** Lightweight integrity check, not encryption or a security signature. */
export function checksum(value: unknown): string {
  let hash = 0x811c9dc5;
  for (const char of stableStringify(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function assertUniqueDates(entries: DailyEntry[]) {
  const dates = new Set<string>();
  for (const entry of entries) {
    if (dates.has(entry.date)) throw new Error(`Duplicate date in backup: ${entry.date}`);
    dates.add(entry.date);
  }
}

function verifyChecksum<T extends { checksum: string }>(backup: T) {
  const { checksum: expected, ...payload } = backup;
  if (checksum(payload) !== expected) throw new Error('Backup checksum does not match.');
}

function migrateV1(backup: BackupV1): BackupV2 {
  const payload = {
    format: BACKUP_FORMAT,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: backup.exportedAt,
    appVersion: backup.appVersion,
    appearance: backup.appearance,
    entries: backup.entries,
  };
  return { ...payload, checksum: checksum(payload) };
}

export function createBackup(entries: DailyEntry[], appearance: MalangAppearance, appVersion = '0.1.0'): BackupV2 {
  const validEntries = entriesSchema.parse(entries);
  const validAppearance = appearanceSchema.parse(appearance);
  assertUniqueDates(validEntries);
  const payload = {
    format: BACKUP_FORMAT,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion,
    appearance: validAppearance,
    entries: validEntries,
  };
  return { ...payload, checksum: checksum(payload) };
}

export function parseBackup(input: unknown): BackupV2 {
  if (!input || typeof input !== 'object') throw new Error('Backup must be a JSON object.');
  const schemaVersion = (input as { schemaVersion?: unknown }).schemaVersion;

  if (schemaVersion === 1) {
    const backup = backupV1Schema.parse(input);
    verifyChecksum(backup);
    assertUniqueDates(backup.entries);
    return migrateV1(backup);
  }

  if (schemaVersion === BACKUP_SCHEMA_VERSION) {
    const backup = backupV2Schema.parse(input);
    verifyChecksum(backup);
    assertUniqueDates(backup.entries);
    return backup;
  }

  throw new Error(`Unsupported backup schema version: ${String(schemaVersion)}`);
}

export type ImportPreview = { additions: DailyEntry[]; collisions: DailyEntry[] };

export function previewImport(backup: Backup, existingDates: Iterable<string>): ImportPreview {
  const dates = new Set(existingDates);
  return {
    additions: backup.entries.filter((entry) => !dates.has(entry.date)),
    collisions: backup.entries.filter((entry) => dates.has(entry.date)),
  };
}
