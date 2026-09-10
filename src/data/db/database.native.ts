import * as SQLite from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';
import { getRandomBytesAsync } from 'expo-crypto';
const DATABASE_KEY_NAME = 'malang.database-key.v1';
let database: SQLite.SQLiteDatabase | null = null;
async function getOrCreateDatabaseKey() { const existing = await SecureStore.getItemAsync(DATABASE_KEY_NAME); if (existing) return existing; const key = Array.from(await getRandomBytesAsync(32), byte => byte.toString(16).padStart(2, '0')).join(''); await SecureStore.setItemAsync(DATABASE_KEY_NAME, key, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }); return key; }
export async function getDatabase() { if (!database) { const key = await getOrCreateDatabaseKey(); database = await SQLite.openDatabaseAsync('malang.db'); await database.execAsync(`PRAGMA key = "x'${key}'"; PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;`); await database.execAsync('CREATE TABLE IF NOT EXISTS daily_entries (date TEXT PRIMARY KEY NOT NULL, emotion_id TEXT NOT NULL, value INTEGER NULL, note TEXT NULL, face_snapshot TEXT NOT NULL, created_at TEXT NOT NULL, timezone_offset_minutes INTEGER NOT NULL, retrospective_flag INTEGER NOT NULL);'); } return database; }
