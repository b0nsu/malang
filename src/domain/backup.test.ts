import { checksum, createBackup, parseBackup, previewImport } from './backup';
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

describe('backup contract', () => {
  it('round-trips a valid versioned backup', () => {
    const backup = createBackup([entry], entry.faceSnapshot.appearance);
    expect(parseBackup(JSON.parse(JSON.stringify(backup))).entries).toEqual([entry]);
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
    const duplicate = { ...entry, emotionId: 'another-emotion' };
    const backup = createBackup([entry, duplicate], entry.faceSnapshot.appearance);
    expect(() => parseBackup(backup)).toThrow(/duplicate date/i);
  });

  it('rejects malformed face parameters even when the checksum is valid', () => {
    const backup = createBackup([entry], entry.faceSnapshot.appearance);
    const malformed = JSON.parse(JSON.stringify(backup));
    malformed.entries[0].faceSnapshot.parameters = { version: 1 };
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
});
