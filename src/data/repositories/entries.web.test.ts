import { findEntry, listEntries, replaceEntries, saveEntry } from './entries.web';
import { neutralFace } from '@/domain/face';

const snapshot = {
  version: 1 as const,
  parameters: neutralFace,
  appearance: { baseColor: '#FFFFFF', materialId: 'default', decorationIds: [] },
};
const metadata = { createdAt: '2026-09-11T00:00:00.000Z', timezoneOffsetMinutes: 0, retrospectiveFlag: false };

describe('web entry repository', () => {
  it('saves and retrieves an entry', async () => {
    await saveEntry({ date: '2026-09-11', emotionId: 'emotion-01', value: 0, note: null }, snapshot, metadata);
    expect(await findEntry('2026-09-11')).toMatchObject({ value: 0, emotionId: 'emotion-01' });
  });

  it('rejects duplicate dates', async () => {
    await expect(saveEntry({ date: '2026-09-11', emotionId: 'emotion-02', value: null, note: null }, snapshot, metadata)).rejects.toThrow('Duplicate');
  });

  it('only replaces colliding dates explicitly selected by the user', async () => {
    const replacement = { date: '2026-09-11', emotionId: 'emotion-03', value: 4, note: 'changed', faceSnapshot: snapshot, ...metadata };
    await replaceEntries([replacement], new Set());
    expect((await findEntry('2026-09-11'))?.emotionId).toBe('emotion-01');
    await replaceEntries([replacement], new Set(['2026-09-11']));
    expect((await listEntries()).find((entry) => entry.date === '2026-09-11')?.emotionId).toBe('emotion-03');
  });
});
