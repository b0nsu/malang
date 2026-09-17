import { Children, isValidElement, useState, type ReactElement, type ReactNode } from 'react';
import { router } from 'expo-router';
import { neutralFace } from '@/domain/face';
import { defaultAppearance, useAppearance } from '@/features/appearance/store';
import { useEntryDraft } from '@/features/entry-draft/store';
import TodayScreen from './TodayScreen';

jest.mock('react', () => ({ ...jest.requireActual('react'), useRef: jest.fn(value => ({ current: value })), useState: jest.fn(value => [value, jest.fn()]), useEffect: jest.fn() }));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/features/malang-3d/MalangScene', () => ({ MalangScene: 'MalangScene' }));
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@/features/appearance/store', () => {
  const actual = jest.requireActual('@/features/appearance/store');
  return { ...actual, useAppearance: Object.assign((select: (state: unknown) => unknown) => select(actual.useAppearance.getState()), actual.useAppearance) };
});

function elements(node: ReactNode): ReactElement<any>[] {
  return Children.toArray(node).flatMap(child => isValidElement<{ children?: ReactNode }>(child) ? [child, ...elements(child.props.children)] : []);
}

beforeEach(() => {
  jest.clearAllMocks();
  (useState as jest.Mock).mockImplementation(value => [value, jest.fn()]);
  useAppearance.getState().setFace(neutralFace);
  useAppearance.getState().setAppearance(defaultAppearance);
});

it('uses hydrated current appearance and removes the Today-only tab bar', () => {
  useAppearance.getState().setFace({ ...neutralFace, face: { ...neutralFace.face, width: .7 } });
  useAppearance.getState().setAppearance({ ...defaultAppearance, baseColor: '#A8A0C7' });
  const tree = elements(TodayScreen());
  const scene = tree.find(element => element.type === 'MalangScene')!;
  expect(scene.props.face).toEqual(useAppearance.getState().face);
  expect(scene.props.appearance.baseColor).toBe('#A8A0C7');
  expect(tree.some(element => element.props.active === 'today')).toBe(false);
});

it('gates draft creation until hydration and captures structure with neutral expression', () => {
  useAppearance.setState({ hydrated: false });
  expect(elements(TodayScreen()).find(element => element.props.label === '오늘 남기기')!.props.disabled).toBe(true);
  useAppearance.getState().setFace({ ...neutralFace, mouth: { leftCornerY: .6, rightCornerY: -.7, openness: .4 }, face: { ...neutralFace.face, length: .5 } });
  useAppearance.getState().finishHydration();
  const button = elements(TodayScreen()).find(element => element.props.label === '오늘 남기기')!;
  expect(button.props.disabled).toBe(false);
  button.props.onPress();
  expect(useEntryDraft.getState().face.face.length).toBe(.5);
  expect(useEntryDraft.getState().face.mouth).toEqual(neutralFace.mouth);
  expect(router.push).toHaveBeenCalledWith('/entry/new');
});
