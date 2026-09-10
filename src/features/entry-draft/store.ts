import { create } from 'zustand';
import { neutralFace, type FaceParametersV1 } from '@/domain/face';
type EntryDraft = { emotionId:string|null; face:FaceParametersV1; selectEmotion:(id:string)=>void; setFace:(face:FaceParametersV1)=>void; reset:()=>void };
export const useEntryDraft = create<EntryDraft>((set)=>({emotionId:null,face:neutralFace,selectEmotion:(emotionId)=>set({emotionId}),setFace:(face)=>set({face}),reset:()=>set({emotionId:null,face:neutralFace})}));
