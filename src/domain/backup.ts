import { z } from 'zod';
import type { DailyEntry } from './entry';
import type { FaceSnapshotV1 } from './entry';

export type MalangAppearance = FaceSnapshotV1['appearance'];
export type BackupV1 = { schemaVersion: 1; exportedAt: string; appVersion: string; appearance: MalangAppearance; entries: DailyEntry[]; checksum: string };
const faceSchema = z.object({ version: z.literal(1), parameters: z.unknown(), appearance: z.object({ baseColor: z.string(), materialId: z.string(), decorationIds: z.array(z.string()) }) });
export const backupSchema = z.object({ schemaVersion: z.literal(1), exportedAt: z.string(), appVersion: z.string(), appearance: faceSchema.shape.appearance, entries: z.array(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), emotionId: z.string().min(1), value: z.number().int().min(-20).max(20).nullable(), note: z.string().max(120).nullable(), faceSnapshot: faceSchema, createdAt: z.string(), timezoneOffsetMinutes: z.number().int(), retrospectiveFlag: z.boolean() })), checksum: z.string().length(8) });

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
  const backup = backupSchema.parse(input) as BackupV1;
  if (checksum({ schemaVersion: backup.schemaVersion, exportedAt: backup.exportedAt, appVersion: backup.appVersion, appearance: backup.appearance, entries: backup.entries }) !== backup.checksum) throw new Error('Backup checksum does not match.');
  return backup;
}

export type ImportPreview = { additions: DailyEntry[]; collisions: DailyEntry[] };
export function previewImport(backup: BackupV1, existingDates: Iterable<string>): ImportPreview {
  const dates = new Set(existingDates);
  return { additions: backup.entries.filter((entry) => !dates.has(entry.date)), collisions: backup.entries.filter((entry) => dates.has(entry.date)) };
}
