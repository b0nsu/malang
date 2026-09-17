import AsyncStorage from '@react-native-async-storage/async-storage';
import { neutralFace } from '@/domain/face';
import { copyFace, defaultAppearance, useAppearance } from './store';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

beforeEach(async () => {
  await useAppearance.persist.rehydrate();
  useAppearance.getState().setFace(neutralFace);
  useAppearance.getState().setAppearance(defaultAppearance);
});

it('persists only face and appearance, never actions or hydration state', async () => {
  useAppearance.getState().finishHydration();
  useAppearance.getState().setAppearance({ ...defaultAppearance, baseColor: '#E8BEB0', decorationIds: ['sprout'] });
  const stored = JSON.parse((await AsyncStorage.getItem('malang.appearance.v1'))!);
  expect(Object.keys(stored.state).sort()).toEqual(['appearance', 'face']);
  expect(stored.state.appearance).toEqual({ ...defaultAppearance, baseColor: '#E8BEB0', decorationIds: ['sprout'] });
});

it('rehydrates validated geometry and appearance and retains working actions', async () => {
  const face = copyFace(neutralFace);
  face.face.width = .6;
  face.eyes.left.scaleX = 1.4;
  const appearance = { ...defaultAppearance, baseColor: '#A8A0C7' };
  await AsyncStorage.setItem('malang.appearance.v1', JSON.stringify({ state: { face, appearance, hydrated: false, setFace: 'bad' }, version: 0 }));
  await useAppearance.persist.rehydrate();
  expect(useAppearance.getState()).toMatchObject({ face, appearance, hydrated: true });
  expect(useAppearance.getState().setFace).toEqual(expect.any(Function));
  useAppearance.getState().setFace(neutralFace);
  expect(useAppearance.getState().face).toEqual(neutralFace);
});

it('ignores malformed persisted appearance instead of breaking consumers', async () => {
  await AsyncStorage.setItem('malang.appearance.v1', JSON.stringify({ state: { face: { version: 1 }, appearance: null }, version: 0 }));
  await useAppearance.persist.rehydrate();
  expect(useAppearance.getState()).toMatchObject({ face: neutralFace, appearance: defaultAppearance, hydrated: true });
});

it('copies setter inputs and every snapshot branch without mutating historical snapshots', () => {
  const face = copyFace(neutralFace);
  const appearance = { ...defaultAppearance, decorationIds: ['sprout'] };
  useAppearance.getState().setFace(face);
  useAppearance.getState().setAppearance(appearance);
  const snapshot = useAppearance.getState().getSnapshot();
  const historical = JSON.stringify(snapshot);
  face.eyes.left.scaleX = 2;
  appearance.decorationIds.push('other');
  expect(useAppearance.getState().face.eyes.left.scaleX).toBe(1);
  expect(useAppearance.getState().appearance.decorationIds).toEqual(['sprout']);
  useAppearance.getState().setFace(face);
  useAppearance.getState().setAppearance(appearance);
  expect(JSON.stringify(snapshot)).toBe(historical);
  snapshot.parameters.brows.right.outerY = .9;
  snapshot.appearance.decorationIds.length = 0;
  expect(useAppearance.getState().face.brows.right.outerY).toBe(0);
  expect(useAppearance.getState().appearance.decorationIds).toEqual(['sprout', 'other']);
});
