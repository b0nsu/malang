import { Children, isValidElement, useMemo, useState, type ReactElement, type ReactNode } from 'react';
import { useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Circle } from 'react-native-svg';
import type { DailyEntry } from '@/domain/entry';
import { neutralFace } from '@/domain/face';
import { useFocusedResource } from '../useFocusedResource';
import GraphScreen from './GraphScreen';

jest.mock('react', () => ({ ...jest.requireActual('react'), useMemo: jest.fn(), useState: jest.fn() }));
jest.mock('react-native', () => {
  const actual = jest.requireActual('react-native');
  const dimensions = jest.fn();
  return new Proxy(actual, { get(target, property) { return property === 'useWindowDimensions' ? dimensions : target[property]; } });
});
jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn() } }));
jest.mock('../useFocusedResource', () => ({ useFocusedResource: jest.fn() }));

function elements(node: ReactNode): ReactElement<any>[] {
  return Children.toArray(node).flatMap(child => isValidElement<{ children?: ReactNode }>(child) ? [child, ...elements(child.props.children)] : []);
}

function entry(date: string, value: number | null, emotionId = 'emotion-01'): DailyEntry {
  return { date, value, emotionId, note: null, faceSnapshot: { version: 1, parameters: neutralFace, appearance: { baseColor: '#FFFFFF', materialId: 'default', decorationIds: [] } }, createdAt: '2026-09-27T00:00:00.000Z', timezoneOffsetMinutes: 0, retrospectiveFlag: false };
}

beforeEach(() => {
  jest.clearAllMocks();
  (useMemo as jest.Mock).mockImplementation((callback: () => unknown) => callback());
  (useState as jest.Mock).mockImplementation((initial: unknown) => [initial, jest.fn()]);
  jest.mocked(useWindowDimensions).mockReturnValue({ width: 390, height: 800, scale: 1, fontScale: 1 });
});

it('opens the matching dated record from each graph point and its accessible text button', () => {
  jest.mocked(useFocusedResource).mockReturnValue({ data: [entry('2026-09-25', -3), entry('2026-09-26', null), entry('2026-09-27', 0, 'emotion-02')], loading: false, error: null, retry: jest.fn() });
  const nodes = elements(GraphScreen());
  const pointTargets = nodes.filter(node => node.type === Circle && node.props.onPress);
  expect(pointTargets).toHaveLength(2);
  pointTargets[0].props.onPress();
  pointTargets[1].props.onPress();
  expect(router.push).toHaveBeenNthCalledWith(1, '/entry/2026-09-25');
  expect(router.push).toHaveBeenNthCalledWith(2, '/entry/2026-09-27');

  const recordButtons = nodes.filter(node => typeof node.props.label === 'string' && node.props.label.includes('기록 보기'));
  expect(recordButtons.map(node => node.props.label)).toEqual([
    '2026-09-25 · 기쁨 · 내가 남긴 수치 -3 · 기록 보기',
    '2026-09-27 · 설렘 · 내가 남긴 수치 0 · 기록 보기',
  ]);
  recordButtons[1].props.onPress();
  expect(router.push).toHaveBeenLastCalledWith('/entry/2026-09-27');
});

it('explains an empty value range while leaving value-less records in the record list', () => {
  jest.mocked(useFocusedResource).mockReturnValue({ data: [entry('2026-09-26', null)], loading: false, error: null, retry: jest.fn() });
  const nodes = elements(GraphScreen());
  expect(nodes.some(node => typeof node.props.children === 'string' && node.props.children.includes('수치 없이 남긴 기록은 기록 목록'))).toBe(true);
  expect(nodes.filter(node => node.type === Circle)).toHaveLength(0);
});
