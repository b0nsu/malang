import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { z } from 'zod';
import { createJSONStorage, persist } from 'zustand/middleware';
import { clampFace, faceParametersSchema, neutralFace, type FaceParametersV1 } from '@/domain/face';
import type { FaceSnapshotV1 } from '@/domain/entry';

export type Appearance = FaceSnapshotV1['appearance'];
export const defaultAppearance: Appearance = { baseColor: '#B7D7CF', materialId: 'default', decorationIds: [] };
export const copyAppearance = (appearance: Appearance): Appearance => ({ ...appearance, decorationIds: [...appearance.decorationIds] });
export const copyFace = (face: FaceParametersV1): FaceParametersV1 => clampFace(face);
export const neutralExpression = (face: FaceParametersV1): FaceParametersV1 => {
  const structural = copyFace(face);
  const neutral = copyFace(neutralFace);
  return { ...neutral, face: structural.face, eyes: {
    left: { ...neutral.eyes.left, scaleX: structural.eyes.left.scaleX, scaleY: structural.eyes.left.scaleY },
    right: { ...neutral.eyes.right, scaleX: structural.eyes.right.scaleX, scaleY: structural.eyes.right.scaleY },
  } };
};
export const createFaceSnapshot = (parameters: FaceParametersV1, appearance: Appearance): FaceSnapshotV1 => ({ version: 1, parameters: copyFace(parameters), appearance: copyAppearance(appearance) });

type AppearanceState = {
  face: FaceParametersV1;
  appearance: Appearance;
  hydrated: boolean;
  finishHydration: () => void;
  setFace: (face: FaceParametersV1) => void;
  setAppearance: (appearance: Appearance) => void;
  getSnapshot: () => FaceSnapshotV1;
};

export const useAppearance = create<AppearanceState>()(persist((set, get) => ({
  hydrated: false,
  finishHydration: () => set({ hydrated: true }),
  face: copyFace(neutralFace),
  appearance: copyAppearance(defaultAppearance),
  setFace: (face) => set({ face: copyFace(face) }),
  setAppearance: (appearance) => set({ appearance: copyAppearance(appearance) }),
  getSnapshot: () => createFaceSnapshot(get().face, get().appearance),
}), {
  name: 'malang.appearance.v1',
  storage: createJSONStorage(() => AsyncStorage),
  partialize: ({ face, appearance }) => ({ face, appearance }),
  onRehydrateStorage: (state) => () => state.finishHydration(),
  merge: (persisted, current) => {
    const result = z.object({ face: faceParametersSchema, appearance: z.object({ baseColor: z.string().regex(/^#[0-9a-fA-F]{6}$/), materialId: z.string(), decorationIds: z.array(z.string()) }) }).safeParse(persisted);
    return result.success ? { ...current, face: copyFace(result.data.face), appearance: copyAppearance(result.data.appearance) } : current;
  },
}));
