import { useEntryDraft } from './store';
import { neutralFace } from '@/domain/face';
describe('entry draft face history', () => {
  beforeEach(() => useEntryDraft.getState().reset());
  it('restores the previous gesture state with undo', () => { const changed = { ...neutralFace, face: { ...neutralFace.face, width: .5 } }; useEntryDraft.getState().setFace(changed); useEntryDraft.getState().undoFace(); expect(useEntryDraft.getState().face).toEqual(neutralFace); });
  it('reset returns to neutral while preserving an undo point', () => { const changed = { ...neutralFace, face: { ...neutralFace.face, width: .5 } }; useEntryDraft.getState().setFace(changed); useEntryDraft.getState().resetFace(); expect(useEntryDraft.getState().face).toEqual(neutralFace); useEntryDraft.getState().undoFace(); expect(useEntryDraft.getState().face).toEqual(changed); });
});
