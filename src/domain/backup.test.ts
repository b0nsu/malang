import { checksum, createBackup, parseBackup, previewImport } from './backup';
import { neutralFace } from './face';
import type { DailyEntry } from './entry';
const entry: DailyEntry = { date: '2026-01-01', emotionId: 'calm', value: 0, note: null, faceSnapshot: { version: 1, parameters: neutralFace, appearance: { baseColor: '#fff', materialId: 'default', decorationIds: [] } }, createdAt: '2026-01-01T00:00:00.000Z', timezoneOffsetMinutes: 0, retrospectiveFlag: false };
describe('backup contract', () => {
  it('round-trips a valid versioned backup', () => { const backup = createBackup([entry], entry.faceSnapshot.appearance); expect(parseBackup(JSON.parse(JSON.stringify(backup))).entries).toEqual([entry]); });
  it('rejects changed backup contents', () => { const backup = createBackup([entry], entry.faceSnapshot.appearance); expect(() => parseBackup({ ...backup, appVersion: 'changed' })).toThrow('checksum'); });
  it('is deterministic for the same payload', () => { const value = { schemaVersion: 1 as const, exportedAt: 'x', appVersion: 'x', appearance: entry.faceSnapshot.appearance, entries: [entry] }; expect(checksum(value)).toBe(checksum(value)); });
  it('previews collision dates without selecting a replacement policy', () => { const backup = createBackup([entry], entry.faceSnapshot.appearance); expect(previewImport(backup, [entry.date])).toEqual({ additions: [], collisions: [entry] }); });
});
