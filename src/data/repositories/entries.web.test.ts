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

  it('keeps a saved face snapshot immutable from later source-object changes', async () => {
    const mutableSnapshot = {
      version: 1 as const,
      parameters: { ...neutralFace, face: { ...neutralFace.face, width: .4 } },
      appearance: { baseColor: '#B7D7CF', materialId: 'default', decorationIds: ['sprout'] },
    };
    await saveEntry({ date: '2026-09-12', emotionId: 'emotion-04', value: null, note: null }, mutableSnapshot, metadata);
    mutableSnapshot.parameters.face.width = -.8;
    mutableSnapshot.appearance.baseColor = '#E8BEB0';
    mutableSnapshot.appearance.decorationIds.length = 0;

    const saved = await findEntry('2026-09-12');
    expect(saved?.faceSnapshot.parameters.face.width).toBe(.4);
    expect(saved?.faceSnapshot.appearance).toEqual({ baseColor: '#B7D7CF', materialId: 'default', decorationIds: ['sprout'] });
  });

  it('does not let a retrieved record mutate the stored snapshot', async () => {
    const firstRead = await findEntry('2026-09-12');
    if (!firstRead) throw new Error('fixture missing');
    firstRead.faceSnapshot.parameters.face.width = -.3;
    firstRead.faceSnapshot.appearance.decorationIds.length = 0;

    const secondRead = await findEntry('2026-09-12');
    expect(secondRead?.faceSnapshot.parameters.face.width).toBe(.4);
    expect(secondRead?.faceSnapshot.appearance.decorationIds).toEqual(['sprout']);
  });
});
