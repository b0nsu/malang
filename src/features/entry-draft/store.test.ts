import { useEntryDraft } from './store';
import { neutralFace } from '@/domain/face';

describe('entry draft face history', () => {
  beforeEach(() => useEntryDraft.getState().reset());

  it('starts a new daily face from a clean neutral history', () => {
    const abandoned = { ...neutralFace, face: { ...neutralFace.face, width: .7 } };
    useEntryDraft.getState().setFace(abandoned);
    useEntryDraft.getState().startFace(neutralFace);
    expect(useEntryDraft.getState().face).toEqual(neutralFace);
    expect(useEntryDraft.getState().faceHistory).toEqual([]);
    useEntryDraft.getState().undoFace();
    expect(useEntryDraft.getState().face).toEqual(neutralFace);
  });

  it('restores the previous gesture state with undo', () => {
    const changed = { ...neutralFace, face: { ...neutralFace.face, width: .5 } };
    useEntryDraft.getState().setFace(changed);
    useEntryDraft.getState().undoFace();
    expect(useEntryDraft.getState().face).toEqual(neutralFace);
  });

  it('keeps drag previews out of history until the gesture commits', () => {
    const start = useEntryDraft.getState().face;
    const preview = { ...start, mouth: { ...start.mouth, leftCornerY: .6 } };
    useEntryDraft.getState().previewFace(preview);
    expect(useEntryDraft.getState().face).toEqual(preview);
    expect(useEntryDraft.getState().faceHistory).toHaveLength(0);

    useEntryDraft.getState().commitFaceEdit(start);
    expect(useEntryDraft.getState().faceHistory).toEqual([start]);
    useEntryDraft.getState().undoFace();
    expect(useEntryDraft.getState().face).toEqual(start);
  });

  it('reset returns to neutral while preserving an undo point', () => {
    const changed = { ...neutralFace, face: { ...neutralFace.face, width: .5 } };
    useEntryDraft.getState().setFace(changed);
    useEntryDraft.getState().resetFace();
    expect(useEntryDraft.getState().face).toEqual(neutralFace);
    useEntryDraft.getState().undoFace();
    expect(useEntryDraft.getState().face).toEqual(changed);
  });
});
