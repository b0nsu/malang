import { BACKUP_FORMAT, BACKUP_SCHEMA_VERSION, checksum, createBackup, parseBackup, previewImport } from './backup';
import { neutralFace } from './face';
import type { DailyEntry } from './entry';

const entry: DailyEntry = {
  date: '2026-01-01',
  emotionId: 'calm',
  value: 0,
  note: null,
  faceSnapshot: {
    version: 1,
    parameters: neutralFace,
    appearance: { baseColor: '#FFFFFF', materialId: 'default', decorationIds: [] },
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  timezoneOffsetMinutes: 0,
  retrospectiveFlag: false,
};

const customizedFace = {
  ...neutralFace,
  eyes: { ...neutralFace.eyes, left: { ...neutralFace.eyes.left, scaleX: 1.4 } },
  face: { ...neutralFace.face, width: .35 },
};

describe('backup contract', () => {
  it('round-trips records and the current Face Studio geometry', () => {
    const backup = createBackup([entry], entry.faceSnapshot.appearance, '1.0.0', customizedFace);
    const restored = parseBackup(JSON.parse(JSON.stringify(backup)));
    expect(restored.entries).toEqual([entry]);
    expect(restored.currentFace).toEqual(customizedFace);
  });

  it('rejects changed backup contents', () => {
    const backup = createBackup([entry], entry.faceSnapshot.appearance);
    expect(() => parseBackup({ ...backup, appVersion: 'changed' })).toThrow('checksum');
  });

  it('is deterministic for the same payload', () => {
    const backup = createBackup([entry], entry.faceSnapshot.appearance);
    const { checksum: _ignored, ...payload } = backup;
    expect(checksum(payload)).toBe(checksum(payload));
  });

  it('previews collision dates without selecting a replacement policy', () => {
    const backup = createBackup([entry], entry.faceSnapshot.appearance);
    expect(previewImport(backup, [entry.date])).toEqual({ additions: [], collisions: [entry] });
  });

  it('rejects duplicate dates before restore can replace local records', () => {
    const backup = createBackup([entry], entry.faceSnapshot.appearance);
    const duplicate = { ...entry, emotionId: 'another-emotion' };
    const malformed = { ...backup, entries: [entry, duplicate] };
    const { checksum: _ignored, ...payload } = malformed;
    expect(() => parseBackup({ ...malformed, checksum: checksum(payload) })).toThrow(/duplicate date/i);
  });

  it('rejects malformed face parameters even when the checksum is valid', () => {
    const backup = createBackup([entry], entry.faceSnapshot.appearance);
    const malformed = JSON.parse(JSON.stringify(backup));
    malformed.entries[0].faceSnapshot.parameters = { version: 1 };
    const { checksum: _ignored, ...payload } = malformed;
    malformed.checksum = checksum(payload);
    expect(() => parseBackup(malformed)).toThrow();
  });

  it('rejects malformed current Face Studio geometry', () => {
    const backup = createBackup([entry], entry.faceSnapshot.appearance);
    const malformed = JSON.parse(JSON.stringify(backup));
    malformed.currentFace = { version: 1 };
    const { checksum: _ignored, ...payload } = malformed;
    malformed.checksum = checksum(payload);
    expect(() => parseBackup(malformed)).toThrow();
  });

  it('rejects multiline notes in imported entries', () => {
    const backup = createBackup([entry], entry.faceSnapshot.appearance);
    const malformed = JSON.parse(JSON.stringify(backup));
    malformed.entries[0].note = 'first line\nsecond line';
    const { checksum: _ignored, ...payload } = malformed;
    malformed.checksum = checksum(payload);
    expect(() => parseBackup(malformed)).toThrow();
  });

  it('migrates existing schema-v1 backups without changing records', () => {
    const v1Payload = {
      schemaVersion: 1 as const,
      exportedAt: '2026-01-01T00:00:00.000Z',
      appVersion: '0.1.0',
      appearance: entry.faceSnapshot.appearance,
      entries: [entry],
    };
    const migrated = parseBackup({ ...v1Payload, checksum: checksum(v1Payload) });
    expect(migrated.format).toBe(BACKUP_FORMAT);
    expect(migrated.schemaVersion).toBe(BACKUP_SCHEMA_VERSION);
    expect(migrated.entries).toEqual([entry]);
    expect(migrated.currentFace).toEqual(neutralFace);
  });

  it('migrates schema-v2 backups with a neutral current geometry fallback', () => {
    const v2Payload = {
      format: BACKUP_FORMAT,
      schemaVersion: 2 as const,
      exportedAt: '2026-01-01T00:00:00.000Z',
      appVersion: '0.1.0',
      appearance: entry.faceSnapshot.appearance,
      entries: [entry],
    };
    const migrated = parseBackup({ ...v2Payload, checksum: checksum(v2Payload) });
    expect(migrated.schemaVersion).toBe(BACKUP_SCHEMA_VERSION);
    expect(migrated.currentFace).toEqual(neutralFace);
    expect(migrated.entries).toEqual([entry]);
  });
});
