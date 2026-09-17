import type { SQLiteDatabase } from 'expo-sqlite';
import { DATABASE_VERSION, migrateDatabase } from './migrations';

type SqliteDatabaseSync = {
  exec: (sql: string) => void;
  close: () => void;
  prepare: (sql: string) => { run: (...params: unknown[]) => unknown; get: (...params: unknown[]) => Record<string, unknown> | undefined; all: (...params: unknown[]) => unknown[] };
};

const { DatabaseSync } = require('node:sqlite') as { DatabaseSync: new (path: string) => SqliteDatabaseSync };

let sqlite: SqliteDatabaseSync;
let adapter: Pick<SQLiteDatabase, 'execAsync' | 'getFirstAsync'>;
let statements: string[];

beforeEach(() => {
  sqlite = new DatabaseSync(':memory:');
  statements = [];
  adapter = {
    execAsync: jest.fn(async (sql: string) => { statements.push(sql); sqlite.exec(sql); }),
    getFirstAsync: jest.fn(async (sql: string) => sqlite.prepare(sql).get() ?? null) as SQLiteDatabase['getFirstAsync'],
  };
});
afterEach(() => sqlite.close());

const version = () => sqlite.prepare('PRAGMA user_version').get()?.user_version;
const tables = () => sqlite.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all();

describe('SQLite migrations', () => {
  it('creates a fresh schema and records its version inside the transaction', async () => {
    await migrateDatabase(adapter);
    expect(version()).toBe(DATABASE_VERSION);
    expect(tables()).toEqual([{ name: 'daily_entries' }]);
    expect(statements[0]).toBe('BEGIN IMMEDIATE');
    expect(statements.at(-1)).toBe('COMMIT');
    expect(statements.indexOf('PRAGMA user_version = 1')).toBeGreaterThan(statements.findIndex((sql) => sql.startsWith('CREATE TABLE')));
  });
  it('is idempotent and leaves historical snapshots unchanged', async () => {
    await migrateDatabase(adapter);
    sqlite.prepare('INSERT INTO daily_entries VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run('2024-02-29', 'calm', null, null, '{"historical":true}', '2024-02-29T00:00:00.000Z', -540, 1);
    const before = sqlite.prepare('SELECT * FROM daily_entries').all();
    statements.length = 0;
    await migrateDatabase(adapter);
    expect(sqlite.prepare('SELECT * FROM daily_entries').all()).toEqual(before);
    expect(statements).toEqual(['BEGIN IMMEDIATE', 'COMMIT']);
  });
  it('adopts an existing unversioned schema without deleting records', async () => {
    await migrateDatabase(adapter);
    sqlite.exec("INSERT INTO daily_entries VALUES ('2026-01-01', 'calm', 0, NULL, '{}', '2026-01-01T00:00:00Z', 0, 0); PRAGMA user_version = 0;");
    const before = sqlite.prepare('SELECT * FROM daily_entries').all();
    await migrateDatabase(adapter);
    expect(version()).toBe(DATABASE_VERSION);
    expect(sqlite.prepare('SELECT * FROM daily_entries').all()).toEqual(before);
  });
  it('rejects a newer database without downgrading it', async () => {
    sqlite.exec(`PRAGMA user_version = ${DATABASE_VERSION + 1}`);
    await expect(migrateDatabase(adapter)).rejects.toThrow('Unsupported database version');
    expect(version()).toBe(DATABASE_VERSION + 1);
    expect(tables()).toEqual([]);
    expect(statements.at(-1)).toBe('ROLLBACK');
  });
  it.each(['CREATE TABLE', 'PRAGMA user_version =', 'COMMIT'])('rolls back a failure at %s and permits retry', async (failure) => {
    const exec = adapter.execAsync;
    adapter.execAsync = async (sql) => {
      if (sql.startsWith(failure)) throw new Error('migration failed');
      await exec(sql);
    };
    await expect(migrateDatabase(adapter)).rejects.toThrow('migration failed');
    expect(version()).toBe(0);
    expect(tables()).toEqual([]);
    adapter.execAsync = exec;
    await migrateDatabase(adapter);
    expect(version()).toBe(DATABASE_VERSION);
  });
  it('does not roll back a transaction it could not start', async () => {
    sqlite.exec('BEGIN IMMEDIATE');
    await expect(migrateDatabase(adapter)).rejects.toThrow();
    expect(statements).toEqual(['BEGIN IMMEDIATE']);
    sqlite.exec('ROLLBACK');
  });
});
