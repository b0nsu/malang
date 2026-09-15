import { useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { AppText, Button, Card, Screen, ScreenHeader } from '@/design-system/components';
import { findEntry } from '@/data/repositories/entries';
import type { DailyEntry } from '@/domain/entry';
import { emotionName } from '@/domain/emotions/catalog';
import { MalangScene } from '@/features/malang-3d/MalangScene';

export default function EntryViewScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const [entry, setEntry] = useState<DailyEntry | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!date) {
        if (active) setStatus('error');
        return;
      }
      setStatus('loading');
      try {
        const result = await findEntry(date);
        if (!active) return;
        setEntry(result);
        setStatus('ready');
      } catch {
        if (active) setStatus('error');
      }
    };
    void load();
    return () => { active = false; };
  }, [date]);

  return <Screen>
    <ScreenHeader title={date ? `${date}의 기록` : '기록'} back={() => router.back()} />
    {status === 'loading' ? <Card><AppText>기록을 불러오는 중이에요.</AppText></Card> : null}
    {status === 'error' ? <Card>
      <AppText>기록을 불러오지 못했어요.</AppText>
      <AppText variant="bodySmall" tone="secondary">저장된 데이터는 변경하지 않았어요.</AppText>
    </Card> : null}
    {status === 'ready' && entry ? <>
      <MalangScene face={entry.faceSnapshot.parameters} appearance={entry.faceSnapshot.appearance} />
      <Card>
        <AppText variant="body">감정: {emotionName(entry.emotionId)}</AppText>
        {entry.retrospectiveFlag ? <AppText variant="caption" tone="secondary">나중에 남긴 기록이에요.</AppText> : null}
        {entry.value !== null ? <AppText variant="body">수치: {entry.value}</AppText> : null}
        {entry.note ? <AppText variant="body">{entry.note}</AppText> : null}
      </Card>
    </> : null}
    {status === 'ready' && !entry ? <Card><AppText>기록을 찾을 수 없어요.</AppText></Card> : null}
    <Button label="기록 목록" onPress={() => router.replace('/records' as never)} />
  </Screen>;
}
