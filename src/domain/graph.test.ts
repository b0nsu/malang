import { buildGraphSegments, filterEntriesByRange } from './graph';
import { neutralFace } from './face';
import type { DailyEntry } from './entry';
const entry = (date: string, value: number | null): DailyEntry => ({ date, value, emotionId: 'calm', note: null, faceSnapshot: { version: 1, parameters: neutralFace, appearance: { baseColor: '#fff', materialId: 'default', decorationIds: [] } }, createdAt: '2026-01-01T00:00:00.000Z', timezoneOffsetMinutes: 0, retrospectiveFlag: false });
describe('filterEntriesByRange', () => {
  it('clamps the previous month to its last local calendar day', () => {
    const entries = [entry('2026-02-27', 1), entry('2026-02-28', 2), entry('2026-03-01', 3), entry('2026-03-31', 4), entry('2026-04-01', 5)];
    expect(filterEntriesByRange(entries, 'month', new Date(2026, 2, 31, 23, 30)).map(item => item.date)).toEqual(['2026-02-28', '2026-03-01', '2026-03-31']);
  });
  it('clamps leap day when moving back a year', () => {
    expect(filterEntriesByRange([entry('2023-02-28', 1), entry('2023-03-01', 2)], 'year', new Date(2024, 1, 29, 0, 30)).map(item => item.date)).toEqual(['2023-02-28', '2023-03-01']);
  });
  it('includes today and six previous local dates at midnight and late evening', () => {
    const entries = [entry('2026-03-03', 1), entry('2026-03-04', 2), entry('2026-03-10', 3), entry('2026-03-11', 4)];
    for (const hour of [0, 23]) expect(filterEntriesByRange(entries, 'week', new Date(2026, 2, 10, hour, 30)).map(item => item.date)).toEqual(['2026-03-04', '2026-03-10']);
  });
});

describe('buildGraphSegments', () => {
  it('does not bridge dates without a chosen value', () => expect(buildGraphSegments([entry('2026-01-01', 2), entry('2026-01-02', null), entry('2026-01-03', 3)])).toEqual([[{ date: '2026-01-01', value: 2 }], [{ date: '2026-01-03', value: 3 }]]));
  it('breaks a segment when calendar days are missing', () => expect(buildGraphSegments([entry('2026-01-01', 2), entry('2026-01-03', 3)])).toHaveLength(2));
  it('filters ranges without changing sparse-entry semantics', () => { const entries = [entry('2026-01-01', 1), entry('2026-01-31', 2), entry('2026-02-01', 3)]; expect(filterEntriesByRange(entries, 'week', new Date('2026-02-01T12:00:00Z')).map(item => item.date)).toEqual(['2026-01-31', '2026-02-01']); expect(filterEntriesByRange(entries, 'all')).toEqual(entries); });
});
