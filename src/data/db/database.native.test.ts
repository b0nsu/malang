jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(async () => 'a'.repeat(64)), setItemAsync: jest.fn(), WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'device' }));
jest.mock('expo-crypto', () => ({ getRandomBytesAsync: jest.fn() }));
jest.mock('./migrations', () => ({ migrateDatabase: jest.fn(async () => {}) }));

function setup() {
  jest.resetModules();
  const sqlite = require('expo-sqlite');
  const { migrateDatabase } = require('./migrations');
  const db = { execAsync: jest.fn(async () => {}), closeAsync: jest.fn(async () => {}) };
  sqlite.openDatabaseAsync.mockResolvedValue(db);
  const { getDatabase } = require('./database.native');
  return { db, sqlite, migrateDatabase, getDatabase };
}

describe('database initialization', () => {
  it('shares concurrent initialization and never returns a database before migration completes', async () => {
    const { db, sqlite, migrateDatabase, getDatabase } = setup();
    let finish!: () => void;
    migrateDatabase.mockImplementation(() => new Promise<void>((resolve) => { finish = resolve; }));
    const first = getDatabase();
    const second = getDatabase();
    expect(first).toBe(second);
    let resolved = false;
    void first.then(() => { resolved = true; });
    for (let index = 0; index < 10; index += 1) await Promise.resolve();
    expect(migrateDatabase).toHaveBeenCalledWith(db);
    expect(resolved).toBe(false);
    finish();
    expect(await first).toBe(db);
    expect(await getDatabase()).toBe(db);
    expect(sqlite.openDatabaseAsync).toHaveBeenCalledTimes(1);
  });
  it.each(['configuration', 'migration'])('closes on %s failure, preserves the error and retries', async (stage) => {
    const { db, sqlite, migrateDatabase, getDatabase } = setup();
    const error = new Error('initialization failed');
    if (stage === 'configuration') db.execAsync.mockRejectedValueOnce(error);
    else migrateDatabase.mockRejectedValueOnce(error);
    db.closeAsync.mockRejectedValueOnce(new Error('close failed'));
    await expect(getDatabase()).rejects.toBe(error);
    expect(db.closeAsync).toHaveBeenCalledTimes(1);
    expect(await getDatabase()).toBe(db);
    expect(sqlite.openDatabaseAsync).toHaveBeenCalledTimes(2);
  });
  it('retries when opening the database fails', async () => {
    const { db, sqlite, getDatabase } = setup();
    sqlite.openDatabaseAsync.mockRejectedValueOnce(new Error('open failed'));
    await expect(getDatabase()).rejects.toThrow('open failed');
    expect(db.closeAsync).not.toHaveBeenCalled();
    expect(await getDatabase()).toBe(db);
  });
});
