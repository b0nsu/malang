import { create } from 'zustand';
import type { FaceParametersV1 } from '@/domain/face';
import { localDateString, type FaceSnapshotV1 } from '@/domain/entry';
import { copyFace, createFaceSnapshot, neutralExpression, useAppearance, type Appearance } from '@/features/appearance/store';

type EntryDraft = {
  date: string;
  emotionId: string | null;
  face: FaceParametersV1;
  initialFace: FaceParametersV1;
  appearance: Appearance;
  faceHistory: FaceParametersV1[];
  value: number | null;
  note: string;
  setDate: (date: string) => void;
  selectEmotion: (id: string) => void;
  setFace: (face: FaceParametersV1) => void;
  previewFace: (face: FaceParametersV1) => void;
  commitFaceEdit: (previous: FaceParametersV1) => void;
  undoFace: () => void;
  resetFace: () => void;
  setValue: (value: number | null) => void;
  setNote: (note: string) => void;
  startNew: (date?: string) => void;
  getSnapshot: () => FaceSnapshotV1;
  reset: () => void;
};

const freshDraft = (date = localDateString()) => {
  const current = useAppearance.getState().getSnapshot();
  const face = neutralExpression(current.parameters);
  return { date, emotionId: null, face, initialFace: copyFace(face), appearance: current.appearance, faceHistory: [] as FaceParametersV1[], value: null, note: '' };
};

export const useEntryDraft = create<EntryDraft>((set, get) => ({
  ...freshDraft(),
  setDate: (date) => set({ date }),
  selectEmotion: (emotionId) => set({ emotionId }),
  setFace: (face) => set(state => ({ face: copyFace(face), faceHistory: [...state.faceHistory, copyFace(state.face)].slice(-30) })),
  previewFace: (face) => set({ face: copyFace(face) }),
  commitFaceEdit: (previous) => set(state => ({ faceHistory: [...state.faceHistory, copyFace(previous)].slice(-30) })),
  undoFace: () => set(state => {
    const previous = state.faceHistory.at(-1);
    return previous ? { face: copyFace(previous), faceHistory: state.faceHistory.slice(0, -1) } : {};
  }),
  resetFace: () => set(state => ({ face: copyFace(state.initialFace), faceHistory: [...state.faceHistory, copyFace(state.face)].slice(-30) })),
  setValue: (value) => set({ value }),
  setNote: (note) => set({ note }),
  startNew: (date) => set(freshDraft(date)),
  getSnapshot: () => createFaceSnapshot(get().face, get().appearance),
  reset: () => set(freshDraft()),
}));
