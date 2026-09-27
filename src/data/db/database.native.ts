import * as SQLite from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';
import { getRandomBytesAsync } from 'expo-crypto';
import { migrateDatabase } from './migrations';

const DATABASE_KEY_NAME = 'malang.database-key.v1';
let database: Promise<SQLite.SQLiteDatabase> | null = null;
async function getOrCreateDatabaseKey() { const existing = await SecureStore.getItemAsync(DATABASE_KEY_NAME); if (existing) return existing; const key = Array.from(await getRandomBytesAsync(32), byte => byte.toString(16).padStart(2, '0')).join(''); await SecureStore.setItemAsync(DATABASE_KEY_NAME, key, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }); return key; }

async function openDatabase() {
  const key = await getOrCreateDatabaseKey();
  const db = await SQLite.openDatabaseAsync('malang.db');
  try {
    await db.execAsync(`PRAGMA key = "x'${key}'"; PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;`);
    await migrateDatabase(db);
    return db;
  } catch (error) {
    try { await db.closeAsync(); } catch {}
    throw error;
  }
}

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!database) database = openDatabase().catch((error) => {
    database = null;
    throw error;
  });
  return database;
}
