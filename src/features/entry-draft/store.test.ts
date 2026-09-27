import { useEntryDraft } from './store';
import { useAppearance } from '@/features/appearance/store';
import { neutralFace } from '@/domain/face';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

const structuralFace = { ...neutralFace, face: { ...neutralFace.face, width: .5 } };

describe('entry draft face history', () => {
  beforeEach(() => { useAppearance.getState().setFace(neutralFace); useAppearance.getState().setAppearance({ baseColor: '#B7D7CF', materialId: 'default', decorationIds: [] }); useEntryDraft.getState().reset(); });
  it('starts a new draft from current appearance with a neutral expression and structural geometry', () => {
    useAppearance.getState().setFace({ ...structuralFace, brows: { left: { centerY: .8, outerY: -.3 }, right: { centerY: -.6, outerY: .2 } }, mouth: { leftCornerY: .4, rightCornerY: -.5, openness: .7 }, eyes: { left: { openness: .2, tilt: .7, scaleX: 1.4, scaleY: .8 }, right: { openness: .5, tilt: -.2, scaleX: .6, scaleY: 1.2 } } });
    useEntryDraft.getState().startNew();
    const draft = useEntryDraft.getState();
    expect(draft.face.brows).toEqual(neutralFace.brows);
    expect(draft.face.mouth).toEqual(neutralFace.mouth);
    expect(draft.face.eyes).toEqual({ left: { openness: 1, tilt: 0, scaleX: 1.4, scaleY: .8 }, right: { openness: 1, tilt: 0, scaleX: .6, scaleY: 1.2 } });
    expect(draft.face.face.width).toBe(.5);
    expect(draft.appearance).toEqual(useAppearance.getState().appearance);
  });
  it('restores the previous gesture state with undo', () => { useEntryDraft.getState().setFace(structuralFace); useEntryDraft.getState().undoFace(); expect(useEntryDraft.getState().face.face).toEqual(neutralFace.face); });
  it('reset returns to the draft start while preserving an undo point', () => {
    useEntryDraft.getState().setFace(structuralFace);
    const changed = useEntryDraft.getState().face;
    useEntryDraft.getState().resetFace();
    expect(useEntryDraft.getState().face).toEqual(neutralFace);
    useEntryDraft.getState().undoFace();
    expect(useEntryDraft.getState().face).toEqual(changed);
  });
  it('snapshot deep-copies parameters and appearance so later edits stay out of it', () => {
    useEntryDraft.getState().setFace(structuralFace);
    const snapshot = useEntryDraft.getState().getSnapshot();
    expect(snapshot.parameters).not.toBe(useEntryDraft.getState().face);
    expect(snapshot.appearance).not.toBe(useAppearance.getState().appearance);
    expect(snapshot.appearance.decorationIds).not.toBe(useAppearance.getState().appearance.decorationIds);
    useEntryDraft.getState().previewFace({ ...structuralFace, face: { ...structuralFace.face, width: 1 } });
    useAppearance.getState().setAppearance({ baseColor: '#E8BEB0', materialId: 'soft', decorationIds: ['sprout'] });
    expect(snapshot.parameters.face.width).toBe(.5);
    expect(snapshot.appearance.baseColor).toBe('#B7D7CF');
    expect(snapshot.version).toBe(1);
  });
});
