import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { neutralFace, type FaceParametersV1 } from '@/domain/face';
type AppearanceState = { face: FaceParametersV1; setFace: (face: FaceParametersV1) => void };
/** Current appearance is persisted separately; entries always serialize their own snapshot. */
export const useAppearance = create<AppearanceState>()(persist((set) => ({ face: neutralFace, setFace: (face) => set({ face }) }), { name: 'malang.appearance.v1', storage: createJSONStorage(() => AsyncStorage) }));
