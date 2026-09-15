import * as SQLite from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';
import { getRandomBytesAsync } from 'expo-crypto';

const DATABASE_KEY_NAME = 'malang.database-key.v1';
const DATABASE_VERSION = 1;
let database: SQLite.SQLiteDatabase | null = null;

async function getOrCreateDatabaseKey() {
  const existing = await SecureStore.getItemAsync(DATABASE_KEY_NAME);
  if (existing) return existing;
  const key = Array.from(await getRandomBytesAsync(32), (byte) => byte.toString(16).padStart(2, '0')).join('');
  await SecureStore.setItemAsync(DATABASE_KEY_NAME, key, { keychainAccessible: SecureStore.WHEN_UNLOCKED });
  return key;
}

async function migrateDatabase(db: SQLite.SQLiteDatabase) {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;
  if (currentVersion > DATABASE_VERSION) throw new Error(`Database schema ${currentVersion} is newer than supported version ${DATABASE_VERSION}.`);
  if (currentVersion >= DATABASE_VERSION) return;

  if (currentVersion === 0) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS daily_entries (
        date TEXT PRIMARY KEY NOT NULL,
        emotion_id TEXT NOT NULL,
        value INTEGER NULL,
        note TEXT NULL,
        face_snapshot TEXT NOT NULL,
        created_at TEXT NOT NULL,
        timezone_offset_minutes INTEGER NOT NULL,
        retrospective_flag INTEGER NOT NULL
      );
    `);
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION};`);
}

export async function getDatabase() {
  if (!database) {
    const key = await getOrCreateDatabaseKey();
    const nextDatabase = await SQLite.openDatabaseAsync('malang.db');
    try {
      await nextDatabase.execAsync(`PRAGMA key = "x'${key}'"; PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;`);
      await migrateDatabase(nextDatabase);
      database = nextDatabase;
    } catch (error) {
      await nextDatabase.closeAsync();
      throw error;
    }
  }
  return database;
}
