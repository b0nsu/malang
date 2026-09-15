import { create } from 'zustand';
import { neutralFace, type FaceParametersV1 } from '@/domain/face';
import { localDateString } from '@/domain/entry';

type EntryDraft = {
  date: string;
  emotionId: string | null;
  face: FaceParametersV1;
  faceHistory: FaceParametersV1[];
  value: number | null;
  note: string;
  setDate: (date: string) => void;
  selectEmotion: (id: string) => void;
  startFace: (face: FaceParametersV1) => void;
  setFace: (face: FaceParametersV1) => void;
  previewFace: (face: FaceParametersV1) => void;
  commitFaceEdit: (previous: FaceParametersV1) => void;
  undoFace: () => void;
  resetFace: () => void;
  setValue: (value: number | null) => void;
  setNote: (note: string) => void;
  reset: () => void;
};

export const useEntryDraft = create<EntryDraft>((set) => ({
  date: localDateString(),
  emotionId: null,
  face: neutralFace,
  faceHistory: [],
  value: null,
  note: '',
  setDate: (date) => set({ date }),
  selectEmotion: (emotionId) => set({ emotionId }),
  startFace: (face) => set({ face, faceHistory: [] }),
  setFace: (face) => set((state) => ({ face, faceHistory: [...state.faceHistory, state.face].slice(-30) })),
  previewFace: (face) => set({ face }),
  commitFaceEdit: (previous) => set((state) => ({ faceHistory: [...state.faceHistory, previous].slice(-30) })),
  undoFace: () => set((state) => {
    const previous = state.faceHistory.at(-1);
    return previous ? { face: previous, faceHistory: state.faceHistory.slice(0, -1) } : {};
  }),
  resetFace: () => set((state) => ({ face: neutralFace, faceHistory: [...state.faceHistory, state.face].slice(-30) })),
  setValue: (value) => set({ value }),
  setNote: (note) => set({ note }),
  reset: () => set({ date: localDateString(), emotionId: null, face: neutralFace, faceHistory: [], value: null, note: '' }),
}));
