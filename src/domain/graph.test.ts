import { buildGraphSegments, filterEntriesByRange } from './graph';
import { neutralFace } from './face';
import type { DailyEntry } from './entry';
const entry = (date: string, value: number | null): DailyEntry => ({ date, value, emotionId: 'calm', note: null, faceSnapshot: { version: 1, parameters: neutralFace, appearance: { baseColor: '#fff', materialId: 'default', decorationIds: [] } }, createdAt: '2026-01-01T00:00:00.000Z', timezoneOffsetMinutes: 0, retrospectiveFlag: false });
describe('buildGraphSegments', () => {
  it('does not bridge dates without a chosen value', () => expect(buildGraphSegments([entry('2026-01-01', 2), entry('2026-01-02', null), entry('2026-01-03', 3)])).toEqual([[{ date: '2026-01-01', value: 2 }], [{ date: '2026-01-03', value: 3 }]]));
  it('breaks a segment when calendar days are missing', () => expect(buildGraphSegments([entry('2026-01-01', 2), entry('2026-01-03', 3)])).toHaveLength(2));
  it('filters ranges without changing sparse-entry semantics', () => { const entries = [entry('2026-01-01', 1), entry('2026-01-31', 2), entry('2026-02-01', 3)]; expect(filterEntriesByRange(entries, 'week', new Date('2026-02-01T12:00:00Z')).map(item => item.date)).toEqual(['2026-01-31', '2026-02-01']); expect(filterEntriesByRange(entries, 'all')).toEqual(entries); });
});
