import { z } from 'zod';
import { faceParametersSchema } from './face';

const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ISO_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

export const isLocalDate = (value: string) => {
  if (!LOCAL_DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};

const isIsoTimestamp = (value: string) => ISO_TIMESTAMP_PATTERN.test(value) && !Number.isNaN(Date.parse(value));

export const localDateSchema = z.string().regex(LOCAL_DATE_PATTERN).refine(isLocalDate, 'Date must be a real local calendar date.');
export const noteSchema = z.string().max(120).refine((note) => !note.includes('\n') && !note.includes('\r'), 'Note must be single-line');

export const appearanceSchema = z.object({
  baseColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  materialId: z.string().min(1).max(64),
  decorationIds: z.array(z.string().min(1).max(64)).max(32),
}).strict();

export const faceSnapshotSchema = z.object({
  version: z.literal(1),
  parameters: faceParametersSchema,
  appearance: appearanceSchema,
}).strict();

export const entryInputSchema = z.object({
  date: localDateSchema,
  emotionId: z.string().min(1).max(64),
  value: z.number().int().min(-20).max(20).nullable(),
  note: noteSchema.nullable(),
}).strict();

export const dailyEntrySchema = entryInputSchema.extend({
  faceSnapshot: faceSnapshotSchema,
  createdAt: z.string().refine(isIsoTimestamp, 'createdAt must be an ISO-8601 timestamp.'),
  timezoneOffsetMinutes: z.number().int().min(-840).max(840),
  retrospectiveFlag: z.boolean(),
}).strict();

export type FaceSnapshotV1 = z.infer<typeof faceSnapshotSchema>;
export type EntryInput = z.infer<typeof entryInputSchema>;
export type DailyEntry = z.infer<typeof dailyEntrySchema>;

export const localDateString = (date = new Date()) => {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

export const isRetrospectiveDate = (date: string, today = localDateString()) => date < today;
