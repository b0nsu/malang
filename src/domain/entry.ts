import { z } from 'zod';
import type { FaceParametersV1 } from './face';
export type FaceSnapshotV1 = {version:1;parameters:FaceParametersV1;appearance:{baseColor:string;materialId:string;decorationIds:string[]}};
export type DailyEntry = {date:string;emotionId:string;value:number|null;note:string|null;faceSnapshot:FaceSnapshotV1;createdAt:string;timezoneOffsetMinutes:number;retrospectiveFlag:boolean};
export const entryInputSchema=z.object({date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),emotionId:z.string().min(1),value:z.number().int().min(-20).max(20).nullable(),note:z.string().max(120).refine((note)=>!note.includes('\n'), 'Note must be single-line').nullable()});
