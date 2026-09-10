export const ENTRY_VALUE_MIN = -20;
export const ENTRY_VALUE_MAX = 20;
export const entryValues = Array.from({ length: ENTRY_VALUE_MAX - ENTRY_VALUE_MIN + 1 }, (_, index) => index + ENTRY_VALUE_MIN);

export function isEntryValue(value: number | null): value is number {
  return value === null || (Number.isInteger(value) && value >= ENTRY_VALUE_MIN && value <= ENTRY_VALUE_MAX);
}

/** A null value means “not selected”; 0 is an intentional selected value. */
export function entryValueLabel(value: number | null) {
  if (value === null) return '선택 안 함';
  return value > 0 ? `+${value}` : String(value);
}
