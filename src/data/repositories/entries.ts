import { getDatabase } from '@/data/db/database';
import { dailyEntrySchema, entryInputSchema, type DailyEntry, type EntryInput } from '@/domain/entry';

type Row = {
  date: string;
  emotion_id: string;
  value: number | null;
  note: string | null;
  face_snapshot: string;
  created_at: string;
  timezone_offset_minutes: number;
  retrospective_flag: number;
};

const toEntry = (row: Row): DailyEntry => dailyEntrySchema.parse({
  date: row.date,
  emotionId: row.emotion_id,
  value: row.value,
  note: row.note,
  faceSnapshot: JSON.parse(row.face_snapshot),
  createdAt: row.created_at,
  timezoneOffsetMinutes: row.timezone_offset_minutes,
  retrospectiveFlag: Boolean(row.retrospective_flag),
});

const validateEntryBatch = (entries: DailyEntry[]) => {
  const validEntries = dailyEntrySchema.array().parse(entries);
  const dates = new Set<string>();
  for (const entry of validEntries) {
    if (dates.has(entry.date)) throw new Error(`Duplicate date in restore batch: ${entry.date}`);
    dates.add(entry.date);
  }
  return validEntries;
};

export async function findEntry(date: string) {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Row>('SELECT * FROM daily_entries WHERE date = ?', date);
  return row ? toEntry(row) : null;
}

export async function listEntries() {
  const db = await getDatabase();
  return (await db.getAllAsync<Row>('SELECT * FROM daily_entries ORDER BY date DESC')).map(toEntry);
}

export async function saveEntry(
  input: EntryInput,
  snapshot: DailyEntry['faceSnapshot'],
  metadata: Pick<DailyEntry, 'createdAt' | 'timezoneOffsetMinutes' | 'retrospectiveFlag'>,
) {
  const validInput = entryInputSchema.parse(input);
  const entry = dailyEntrySchema.parse({ ...validInput, faceSnapshot: snapshot, ...metadata });
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'INSERT INTO daily_entries (date, emotion_id, value, note, face_snapshot, created_at, timezone_offset_minutes, retrospective_flag) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      entry.date,
      entry.emotionId,
      entry.value,
      entry.note,
      JSON.stringify(entry.faceSnapshot),
      entry.createdAt,
      entry.timezoneOffsetMinutes,
      Number(entry.retrospectiveFlag),
    );
  });
}

export async function replaceEntries(entries: DailyEntry[], replaceDates: Set<string>) {
  const validEntries = validateEntryBatch(entries);
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    for (const entry of validEntries) {
      if (replaceDates.has(entry.date)) await db.runAsync('DELETE FROM daily_entries WHERE date = ?', entry.date);
      const exists = await db.getFirstAsync<{ date: string }>('SELECT date FROM daily_entries WHERE date = ?', entry.date);
      if (!exists) {
        await db.runAsync(
          'INSERT INTO daily_entries (date, emotion_id, value, note, face_snapshot, created_at, timezone_offset_minutes, retrospective_flag) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          entry.date,
          entry.emotionId,
          entry.value,
          entry.note,
          JSON.stringify(entry.faceSnapshot),
          entry.createdAt,
          entry.timezoneOffsetMinutes,
          Number(entry.retrospectiveFlag),
        );
      }
    }
  });
}
