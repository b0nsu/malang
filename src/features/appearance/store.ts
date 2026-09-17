import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { z } from 'zod';
import { faceParametersSchema, neutralFace, type FaceParametersV1 } from '@/domain/face';
import { appearanceSchema, type FaceSnapshotV1 } from '@/domain/entry';

export type Appearance = FaceSnapshotV1['appearance'];
export const defaultAppearance: Appearance = { baseColor: '#B7D7CF', materialId: 'default', decorationIds: [] };

type AppearanceState = {
  face: FaceParametersV1;
  appearance: Appearance;
  setFace: (face: FaceParametersV1) => void;
  setAppearance: (appearance: Appearance) => void;
  setCurrent: (face: FaceParametersV1, appearance: Appearance) => void;
};

const persistedAppearanceContainerSchema = z.object({
  face: z.unknown().optional(),
  appearance: z.unknown().optional(),
}).passthrough();

export function normalizePersistedAppearance(value: unknown): Pick<AppearanceState, 'face' | 'appearance'> {
  const container = persistedAppearanceContainerSchema.safeParse(value);
  const candidate = container.success ? container.data : {};
  const face = faceParametersSchema.safeParse(candidate.face);
  const appearance = appearanceSchema.safeParse(candidate.appearance);
  return {
    face: face.success ? face.data : neutralFace,
    appearance: appearance.success ? appearance.data : defaultAppearance,
  };
}

/** Current appearance is persisted separately; entries always serialize their own immutable snapshot. */
export const useAppearance = create<AppearanceState>()(persist(
  (set) => ({
    face: neutralFace,
    appearance: defaultAppearance,
    setFace: (face) => set({ face }),
    setAppearance: (appearance) => set({ appearance }),
    setCurrent: (face, appearance) => set({ face, appearance }),
  }),
  {
    name: 'malang.appearance.v1',
    storage: createJSONStorage(() => AsyncStorage),
    merge: (persistedState, currentState) => ({ ...currentState, ...normalizePersistedAppearance(persistedState) }),
  },
));
