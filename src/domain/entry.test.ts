import { entryInputSchema, isLocalDate, isRetrospectiveDate } from './entry';

describe('entry input', () => {
  const base = { date: '2026-09-11', emotionId: 'emotion-01', value: null, note: null };

  it('keeps a missing value distinct from zero', () => {
    expect(entryInputSchema.parse(base).value).toBeNull();
    expect(entryInputSchema.parse({ ...base, value: 0 }).value).toBe(0);
  });

  it('rejects multi-line and oversized notes', () => {
    expect(entryInputSchema.safeParse({ ...base, note: 'a'.repeat(121) }).success).toBe(false);
    expect(entryInputSchema.safeParse({ ...base, note: 'line one\nline two' }).success).toBe(false);
  });

  it('rejects impossible calendar dates at the validation boundary', () => {
    expect(entryInputSchema.safeParse({ ...base, date: '2026-02-30' }).success).toBe(false);
  });
});

describe('entry calendar rules', () => {
  it('accepts real local calendar dates only', () => {
    expect(isLocalDate('2026-02-28')).toBe(true);
    expect(isLocalDate('2026-02-30')).toBe(false);
  });

  it('marks only dates before today as retrospective', () => {
    expect(isRetrospectiveDate('2026-01-01', '2026-01-02')).toBe(true);
    expect(isRetrospectiveDate('2026-01-02', '2026-01-02')).toBe(false);
  });
});
