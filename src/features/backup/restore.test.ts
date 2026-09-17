jest.mock('expo-file-system/legacy', () => ({ getInfoAsync: jest.fn(), readAsStringAsync: jest.fn() }));
jest.mock('@/data/repositories/entries', () => ({ listEntries: jest.fn(), replaceEntries: jest.fn() }));

import * as FileSystem from 'expo-file-system/legacy';
import { listEntries, replaceEntries } from '@/data/repositories/entries';
import { createBackup, MAX_BACKUP_BYTES, parseBackup } from '@/domain/backup';
import { neutralFace } from '@/domain/face';
import type { DailyEntry } from '@/domain/entry';
import { readBackupFile, restoreBackup } from './restore';

const entry: DailyEntry = { date: '2024-02-29', emotionId: 'calm', value: null, note: null, faceSnapshot: { version: 1, parameters: neutralFace, appearance: { baseColor: '#fff', materialId: 'default', decorationIds: [] } }, createdAt: '2024-02-29T00:00:00.000Z', timezoneOffsetMinutes: -540, retrospectiveFlag: true };
const getInfo = jest.mocked(FileSystem.getInfoAsync);
const read = jest.mocked(FileSystem.readAsStringAsync);
const list = jest.mocked(listEntries);
const replace = jest.mocked(replaceEntries);

beforeEach(() => {
  jest.resetAllMocks();
  getInfo.mockResolvedValue({ exists: true, isDirectory: false, size: 100, uri: 'file://backup', modificationTime: 0 });
  read.mockResolvedValue(JSON.stringify(createBackup([entry], entry.faceSnapshot.appearance)));
  list.mockResolvedValue([]);
  replace.mockResolvedValue(undefined);
});

describe('backup file boundary', () => {
  it('checks actual file metadata before reading when picker size is absent', async () => {
    expect((await readBackupFile({ uri: 'file://backup' })).entries).toEqual([entry]);
    expect(getInfo.mock.invocationCallOrder[0]).toBeLessThan(read.mock.invocationCallOrder[0]);
  });
  it('rejects oversized picker metadata without reading or parsing', async () => {
    await expect(readBackupFile({ uri: 'file://backup', size: MAX_BACKUP_BYTES + 1 })).rejects.toThrow('file size');
    expect(getInfo).not.toHaveBeenCalled();
    expect(read).not.toHaveBeenCalled();
  });
  it.each([0, -1, NaN, Infinity, undefined, MAX_BACKUP_BYTES + 1])('rejects invalid actual size %s despite smaller picker metadata', async (size) => {
    getInfo.mockResolvedValue({ exists: true, isDirectory: false, size, uri: 'file://backup', modificationTime: 0 } as FileSystem.FileInfo);
    await expect(readBackupFile({ uri: 'file://backup', size: 100 })).rejects.toThrow('file size');
    expect(read).not.toHaveBeenCalled();
  });
  it.each([false, true])('rejects missing files or directories before reading (%s)', async (exists) => {
    getInfo.mockResolvedValue({ exists, isDirectory: exists, size: 100, uri: 'file://backup', modificationTime: 0 } as FileSystem.FileInfo);
    await expect(readBackupFile({ uri: 'file://backup' })).rejects.toThrow('unavailable');
    expect(read).not.toHaveBeenCalled();
  });
  it('rejects a changed oversized body before JSON parsing', async () => {
    read.mockResolvedValue('x'.repeat(MAX_BACKUP_BYTES + 1));
    const parse = jest.spyOn(JSON, 'parse');
    try {
      await expect(readBackupFile({ uri: 'file://backup' })).rejects.toThrow('file size');
      expect(parse).not.toHaveBeenCalled();
    } finally { parse.mockRestore(); }
  });
  it('rejects malformed JSON without touching local records', async () => {
    read.mockResolvedValue('{');
    await expect(readBackupFile({ uri: 'file://backup' })).rejects.toThrow();
    expect(list).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });
});

describe('restore collision policy', () => {
  const addition = { ...entry, date: '2024-03-01' };
  const backup = () => parseBackup(createBackup([entry, addition], { ...entry.faceSnapshot.appearance, baseColor: '#000' }));
  it('does not write until an explicit collision choice resolves', async () => {
    list.mockResolvedValue([entry]);
    let choose!: (policy: 'keep') => void;
    const policy = jest.fn(() => new Promise<'keep'>((resolve) => { choose = resolve; }));
    const restoring = restoreBackup(backup(), policy);
    await Promise.resolve();
    expect(policy).toHaveBeenCalledWith(1);
    expect(replace).not.toHaveBeenCalled();
    choose('keep');
    await restoring;
    expect(replace).toHaveBeenCalledWith([entry, addition], new Set());
  });
  it('cancels without any write', async () => {
    list.mockResolvedValue([entry]);
    expect(await restoreBackup(backup(), async () => 'cancel')).toBeNull();
    expect(replace).not.toHaveBeenCalled();
  });
  it('replaces only explicitly colliding dates', async () => {
    list.mockResolvedValue([entry]);
    await restoreBackup(backup(), async () => 'replace');
    expect(replace).toHaveBeenCalledWith([entry, addition], new Set([entry.date]));
  });
  it('adds entries without a collision prompt and preserves historical appearance and provenance', async () => {
    const choose = jest.fn();
    const incoming = backup();
    const result = await restoreBackup(incoming, choose);
    expect(choose).not.toHaveBeenCalled();
    expect(result).toEqual({ additions: [entry, addition], collisions: [] });
    incoming.appearance.baseColor = '#123';
    expect(replace.mock.calls[0][0][0]).toEqual(entry);
  });
  it('propagates storage failure rather than reporting success', async () => {
    replace.mockRejectedValue(new Error('storage failed'));
    await expect(restoreBackup(backup(), async () => 'keep')).rejects.toThrow('storage failed');
  });
});
