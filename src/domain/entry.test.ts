import { entryInputSchema } from './entry';

describe('entry input', () => {
  const base = { date: '2026-09-11', emotionId: 'emotion-01', value: null, note: null };
  it('keeps a missing value distinct from zero', () => {
    expect(entryInputSchema.parse(base).value).toBeNull();
    expect(entryInputSchema.parse({ ...base, value: 0 }).value).toBe(0);
  });
  it('rejects multi-line and oversized notes', () => {
    expect(entryInputSchema.safeParse({ ...base, note: 'a'.repeat(121) }).success).toBe(false);
  });
});
