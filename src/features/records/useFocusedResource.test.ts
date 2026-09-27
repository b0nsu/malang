import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useFocusedResource } from './useFocusedResource';

jest.mock('react', () => ({ useCallback: jest.fn(), useState: jest.fn() }));
jest.mock('expo-router', () => ({ useFocusEffect: jest.fn() }));

let state: any[];
let cursor: number;
let focus: () => void | (() => void);

beforeEach(() => {
  state = [];
  cursor = 0;
  (useCallback as jest.Mock).mockImplementation(callback => callback);
  (useState as jest.Mock).mockImplementation(initial => {
    const index = cursor++;
    if (!(index in state)) state[index] = initial;
    return [state[index], (next: any) => { state[index] = typeof next === 'function' ? next(state[index]) : next; }];
  });
  (useFocusEffect as jest.Mock).mockImplementation(callback => { focus = callback; });
});

const render = <T,>(load: () => Promise<T>) => { cursor = 0; return useFocusedResource(load); };
const settle = async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); };

it('distinguishes loading, errors, retry, and an empty successful result', async () => {
  const load = jest.fn<Promise<string[]>, []>().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([]);
  expect(render(load).loading).toBe(true);
  focus();
  await settle();
  expect(render(load)).toMatchObject({ loading: false, data: undefined, error: expect.any(String) });
  render(load).retry();
  expect(state[1]).toBe(1);
  render(load);
  focus();
  expect(render(load)).toMatchObject({ loading: true, error: null });
  await settle();
  expect(render(load)).toMatchObject({ loading: false, error: null, data: [] });
});

it('ignores stale completions after blur or date change', async () => {
  let resolve!: (value: string[]) => void;
  const load = () => new Promise<string[]>(complete => { resolve = complete; });
  render(load);
  const cleanup = focus();
  await settle();
  if (cleanup) cleanup();
  resolve(['stale record']);
  await settle();
  expect(render(load).data).toBeUndefined();
});

it('reloads on focus and preserves a distinct missing-detail result', async () => {
  const load = jest.fn().mockResolvedValue(null);
  render(load);
  const cleanup = focus();
  await settle();
  expect(render(load)).toMatchObject({ data: null, loading: false, error: null });
  if (cleanup) cleanup();
  focus();
  await settle();
  expect(load).toHaveBeenCalledTimes(2);
});
