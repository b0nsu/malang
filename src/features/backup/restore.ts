import * as FileSystem from 'expo-file-system/legacy';
import { listEntries, replaceEntries } from '@/data/repositories/entries';
import { assertBackupFileSize, parseBackupText, previewImport, type BackupV1 } from '@/domain/backup';

export type CollisionPolicy = 'keep' | 'replace' | 'cancel';

export async function readBackupFile(asset: { uri: string; size?: number }): Promise<BackupV1> {
  if (asset.size !== undefined) assertBackupFileSize(asset.size);
  const info = await FileSystem.getInfoAsync(asset.uri);
  if (!info.exists || info.isDirectory) throw new Error('Backup file is unavailable.');
  assertBackupFileSize(info.size);
  return parseBackupText(await FileSystem.readAsStringAsync(asset.uri));
}

export async function restoreBackup(backup: BackupV1, choosePolicy: (count: number) => Promise<CollisionPolicy>) {
  const existing = await listEntries();
  const preview = previewImport(backup, existing.map((entry) => entry.date));
  const policy = preview.collisions.length ? await choosePolicy(preview.collisions.length) : 'keep';
  if (policy === 'cancel') return null;
  await replaceEntries(backup.entries, policy === 'replace' ? new Set(preview.collisions.map((entry) => entry.date)) : new Set());
  return preview;
}
