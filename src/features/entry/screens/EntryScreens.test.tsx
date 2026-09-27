import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { useRef, useState } from 'react';
import { router } from 'expo-router';
import { saveEntry } from '@/data/repositories/entries';
import { useEntryDraft } from '@/features/entry-draft/store';
import EntryDetailsScreen from './EntryDetailsScreen';
import SculptScreen, { GestureHandle } from './SculptScreen';

jest.mock('react', () => ({ ...jest.requireActual('react'), useRef: jest.fn(), useState: jest.fn() }));
jest.mock('expo-router', () => ({ router: { replace: jest.fn(), push: jest.fn(), back: jest.fn() } }));
jest.mock('@/data/repositories/entries', () => ({ saveEntry: jest.fn() }));
jest.mock('@/features/malang-3d/MalangScene', () => ({ MalangScene: 'MalangScene' }));
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@/features/entry-draft/store', () => {
  const actual = jest.requireActual('@/features/entry-draft/store');
  return { useEntryDraft: Object.assign(() => actual.useEntryDraft.getState(), actual.useEntryDraft) };
});

function elements(node: ReactNode): ReactElement<any>[] {
  return Children.toArray(node).flatMap(child => isValidElement<{ children?: ReactNode }>(child) ? [child, ...elements(child.props.children)] : []);
}

beforeEach(() => {
  jest.clearAllMocks();
  (useRef as jest.Mock).mockImplementation(value => ({ current: value }));
  (useState as jest.Mock).mockImplementation(value => [value, jest.fn()]);
  useEntryDraft.getState().reset();
  useEntryDraft.getState().selectEmotion('calm');
});

it('blocks duplicate saves and keeps every draft field after a rejected save, then allows retry', async () => {
  useEntryDraft.getState().setNote('남겨둘 메모');
  useEntryDraft.getState().setValue(0);
  const before = useEntryDraft.getState().getSnapshot();
  let reject!: (reason: Error) => void;
  jest.mocked(saveEntry).mockImplementationOnce(() => new Promise((_, fail) => { reject = fail; }));
  const button = elements(EntryDetailsScreen()).find(element => element.props.label === '기록 저장')!;
  const first = button.props.onPress();
  await button.props.onPress();
  expect(saveEntry).toHaveBeenCalledTimes(1);
  reject(new Error('storage unavailable'));
  await first;
  expect(useEntryDraft.getState()).toMatchObject({ emotionId: 'calm', value: 0, note: '남겨둘 메모' });
  expect(useEntryDraft.getState().getSnapshot()).toEqual(before);
  expect(router.replace).not.toHaveBeenCalled();
  jest.mocked(saveEntry).mockResolvedValueOnce(undefined);
  await button.props.onPress();
  expect(saveEntry).toHaveBeenCalledTimes(2);
  expect(router.replace).toHaveBeenCalledTimes(1);
  expect(useEntryDraft.getState().emotionId).toBeNull();
});

it('requires one emotion while accepting empty optional value and note', async () => {
  useEntryDraft.getState().reset();
  await elements(EntryDetailsScreen()).find(element => element.props.label === '기록 저장')!.props.onPress();
  expect(saveEntry).not.toHaveBeenCalled();
  expect(router.replace).toHaveBeenCalledWith('/entry/emotion');
  useEntryDraft.getState().selectEmotion('calm');
  jest.mocked(saveEntry).mockResolvedValueOnce(undefined);
  await elements(EntryDetailsScreen()).find(element => element.props.label === '기록 저장')!.props.onPress();
  expect(saveEntry).toHaveBeenCalledWith(expect.objectContaining({ emotionId: 'calm', value: null, note: null }), expect.any(Object), expect.any(Object));
});

it('Quick Sculpt actions use clamped edits and retain undo history', () => {
  const handles = elements(SculptScreen()).filter(element => element.type === GestureHandle);
  expect(handles).toHaveLength(9);
  const eyebrow = GestureHandle(handles[0].props);
  expect(eyebrow.props.accessibilityValue).toMatchObject({ min: -1, max: 1, now: 0 });
  expect(eyebrow.props.style.minHeight).toBeGreaterThanOrEqual(48);
  eyebrow.props.onAccessibilityAction({ nativeEvent: { actionName: 'increment' } });
  expect(useEntryDraft.getState().face.brows.left.centerY).toBeCloseTo(.1);
  useEntryDraft.getState().undoFace();
  expect(useEntryDraft.getState().face.brows.left.centerY).toBe(0);
  for (let i = 0; i < 30; i++) eyebrow.props.onAccessibilityAction({ nativeEvent: { actionName: 'increment' } });
  expect(useEntryDraft.getState().face.brows.left.centerY).toBe(1);
  const eye = GestureHandle(handles[4].props);
  eye.props.onAccessibilityAction({ nativeEvent: { actionName: 'moveRight' } });
  expect(useEntryDraft.getState().face.eyes.left.tilt).toBeCloseTo(.1);
  const count = useEntryDraft.getState().faceHistory.length;
  eye.props.onAccessibilityAction({ nativeEvent: { actionName: 'unknown' } });
  expect(useEntryDraft.getState().faceHistory).toHaveLength(count);
});
