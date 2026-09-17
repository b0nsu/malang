import type { SQLiteDatabase } from 'expo-sqlite';

const migrations = [
  'CREATE TABLE IF NOT EXISTS daily_entries (date TEXT PRIMARY KEY NOT NULL, emotion_id TEXT NOT NULL, value INTEGER NULL, note TEXT NULL, face_snapshot TEXT NOT NULL, created_at TEXT NOT NULL, timezone_offset_minutes INTEGER NOT NULL, retrospective_flag INTEGER NOT NULL);',
];

export const DATABASE_VERSION = migrations.length;

export async function migrateDatabase(db: Pick<SQLiteDatabase, 'execAsync' | 'getFirstAsync'>) {
  await db.execAsync('BEGIN IMMEDIATE');
  try {
    const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    const version = row?.user_version;
    if (version === undefined || !Number.isInteger(version) || version < 0 || version > DATABASE_VERSION) throw new Error('Unsupported database version.');
    for (let index = version; index < migrations.length; index += 1) {
      await db.execAsync(migrations[index]);
      await db.execAsync(`PRAGMA user_version = ${index + 1}`);
    }
    await db.execAsync('COMMIT');
  } catch (error) {
    try { await db.execAsync('ROLLBACK'); } catch {}
    throw error;
  }
}
