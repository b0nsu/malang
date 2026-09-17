import { assertBackupFileSize, checksum, createBackup, MAX_BACKUP_BYTES, parseBackup, parseBackupText, previewImport, type BackupV1 } from './backup';
import { neutralFace } from './face';
import type { DailyEntry } from './entry';
const entry: DailyEntry = { date: '2026-01-01', emotionId: 'calm', value: 0, note: null, faceSnapshot: { version: 1, parameters: neutralFace, appearance: { baseColor: '#fff', materialId: 'default', decorationIds: [] } }, createdAt: '2026-01-01T00:00:00.000Z', timezoneOffsetMinutes: 0, retrospectiveFlag: false };
describe('backup contract', () => {
  it('round-trips a valid versioned backup', () => { const backup = createBackup([entry], entry.faceSnapshot.appearance); expect(parseBackup(JSON.parse(JSON.stringify(backup))).entries).toEqual([entry]); });
  it('rejects an out-of-range face even with a valid checksum', () => {
    const invalid = { ...entry, faceSnapshot: { ...entry.faceSnapshot, parameters: { ...neutralFace, face: { ...neutralFace.face, width: 2 } } } };
    const backup = createBackup([invalid], entry.faceSnapshot.appearance);
    expect(() => parseBackup(backup)).toThrow();
  });
  it('rejects changed backup contents', () => { const backup = createBackup([entry], entry.faceSnapshot.appearance); expect(() => parseBackup({ ...backup, appVersion: 'changed' })).toThrow('checksum'); });
  it('is deterministic for the same payload', () => { const value = { schemaVersion: 1 as const, exportedAt: 'x', appVersion: 'x', appearance: entry.faceSnapshot.appearance, entries: [entry] }; expect(checksum(value)).toBe(checksum(value)); });
  it('previews collision dates without selecting a replacement policy', () => { const backup = createBackup([entry], entry.faceSnapshot.appearance); expect(previewImport(backup, [entry.date])).toEqual({ additions: [], collisions: [entry] }); });
  it.each(['2026-02-29', '2024-02-30', '1900-02-29', '2026-04-31', '2026-00-01', '2026-13-01', '2026-01-00', '2026-1-01'])('rejects invalid calendar date %s', (date) => {
    expect(() => parseBackup(createBackup([{ ...entry, date }], entry.faceSnapshot.appearance))).toThrow();
  });
  it.each(['2024-02-29', '2000-02-29', '2026-04-30', '2026-12-31'])('accepts real calendar date %s', (date) => {
    expect(parseBackup(createBackup([{ ...entry, date }], entry.faceSnapshot.appearance)).entries[0].date).toBe(date);
  });
  it('rejects duplicate dates rather than silently choosing one', () => {
    expect(() => parseBackup(createBackup([entry, { ...entry, note: 'other' }], entry.faceSnapshot.appearance))).toThrow('Duplicate backup date');
  });
  it.each(['\n', '\r', '\u2028', '\u2029'])('rejects multiline notes containing %j', (separator) => {
    expect(() => parseBackup(createBackup([{ ...entry, note: `a${separator}b` }], entry.faceSnapshot.appearance))).toThrow();
  });
  it('keeps null values and retrospective provenance and detaches historical snapshots', () => {
    const source = createBackup([{ ...entry, value: null, retrospectiveFlag: true }], entry.faceSnapshot.appearance);
    const parsed = parseBackup(source);
    parsed.appearance.baseColor = '#000';
    parsed.appearance.decorationIds.push('new');
    parsed.entries[0].faceSnapshot.parameters.face.width = 1;
    expect(parsed.entries[0]).toMatchObject({ value: null, retrospectiveFlag: true, faceSnapshot: { appearance: entry.faceSnapshot.appearance } });
    expect(source.entries[0].faceSnapshot.parameters.face.width).toBe(0);
    expect(source.appearance.baseColor).toBe('#fff');
  });
  it.each([undefined, null, {}, { version: 2 }])('rejects incomplete parameters %j', (parameters) => {
    const backup = createBackup([entry], entry.faceSnapshot.appearance);
    expect(() => parseBackup({ ...backup, entries: [{ ...entry, faceSnapshot: { ...entry.faceSnapshot, parameters } }] })).toThrow();
  });
  it.each([0, -1, 1.5, NaN, Infinity, undefined, null, MAX_BACKUP_BYTES + 1])('rejects invalid file size %s', (size) => {
    expect(() => assertBackupFileSize(size)).toThrow('file size');
  });
  it('accepts the byte limit and parses valid JSON', () => {
    expect(() => assertBackupFileSize(MAX_BACKUP_BYTES)).not.toThrow();
    expect(parseBackupText(JSON.stringify(createBackup([entry], entry.faceSnapshot.appearance))).entries).toEqual([entry]);
  });
  it.each(['x'.repeat(MAX_BACKUP_BYTES + 1), '가'.repeat(Math.floor(MAX_BACKUP_BYTES / 3) + 1), '😀'.repeat(Math.floor(MAX_BACKUP_BYTES / 4) + 1)])('rejects oversized text before JSON parsing (%#)', (text) => {
    const parse = jest.spyOn(JSON, 'parse');
    try {
      expect(() => parseBackupText(text)).toThrow('file size');
      expect(parse).not.toHaveBeenCalled();
    } finally { parse.mockRestore(); }
  });
});

const ranges: [string, number, number][] = [
  ...['left', 'right'].flatMap((side): [string, number, number][] => [
    [`brows.${side}.centerY`, -1, 1], [`brows.${side}.outerY`, -1, 1],
    [`eyes.${side}.openness`, 0, 1], [`eyes.${side}.tilt`, -1, 1],
    [`eyes.${side}.scaleX`, 0, 2], [`eyes.${side}.scaleY`, 0, 2],
  ]),
  ['mouth.leftCornerY', -1, 1], ['mouth.rightCornerY', -1, 1], ['mouth.openness', 0, 1],
  ...['width', 'length', 'skewX', 'tilt', 'volume'].map((axis): [string, number, number] => [`face.${axis}`, -1, 1]),
];

function backupWithParameter(path: string, value: unknown) {
  const backup: BackupV1 = JSON.parse(JSON.stringify(createBackup([entry], entry.faceSnapshot.appearance)));
  const keys = path.split('.');
  let target: any = backup.entries[0].faceSnapshot.parameters;
  for (const key of keys.slice(0, -1)) target = target[key];
  target[keys[keys.length - 1]] = value;
  const { checksum: ignored, ...payload } = backup;
  return { ...payload, checksum: checksum(payload) };
}

describe.each(ranges)('face backup range %s [%s, %s]', (path, min, max) => {
  it('accepts both boundaries without clamping', () => {
    for (const value of [min, max]) expect(() => parseBackup(backupWithParameter(path, value))).not.toThrow();
  });
  it('rejects out-of-range, non-finite, missing and nonnumeric values with valid checksums', () => {
    for (const value of [min - .001, max + .001, NaN, Infinity, -Infinity, null, undefined, '0']) {
      expect(() => parseBackup(backupWithParameter(path, value))).toThrow();
    }
  });
});
