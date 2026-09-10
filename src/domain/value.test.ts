import { entryValueLabel, entryValues, isEntryValue } from './value';
describe('entry value rules', () => {
  it('exposes every integer in the inclusive -20 to 20 range', () => { expect(entryValues).toHaveLength(41); expect(entryValues.at(0)).toBe(-20); expect(entryValues.at(-1)).toBe(20); expect(entryValues).toContain(0); });
  it('keeps no selection and explicit zero distinct', () => { expect(isEntryValue(null)).toBe(true); expect(isEntryValue(0)).toBe(true); expect(entryValueLabel(null)).toBe('선택 안 함'); expect(entryValueLabel(0)).toBe('0'); });
  it('rejects values outside the domain', () => { expect(isEntryValue(-21)).toBe(false); expect(isEntryValue(20.5)).toBe(false); });
});
