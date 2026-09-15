import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { neutralFace, type FaceParametersV1 } from '@/domain/face';
import type { FaceSnapshotV1 } from '@/domain/entry';

export type Appearance = FaceSnapshotV1['appearance'];
export const defaultAppearance: Appearance = { baseColor: '#B7D7CF', materialId: 'default', decorationIds: [] };
type AppearanceState = { face: FaceParametersV1; appearance: Appearance; setFace: (face: FaceParametersV1) => void; setAppearance: (appearance: Appearance) => void };
/** Current appearance is persisted separately; entries always serialize their own snapshot. */
export const useAppearance = create<AppearanceState>()(persist((set) => ({ face: neutralFace, appearance: defaultAppearance, setFace: (face) => set({ face }), setAppearance: (appearance) => set({ appearance }) }), { name: 'malang.appearance.v1', storage: createJSONStorage(() => AsyncStorage) }));
