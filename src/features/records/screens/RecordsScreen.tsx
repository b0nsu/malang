import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { AppText, Button, Card, Screen } from '@/design-system/components';
import { listEntries } from '@/data/repositories/entries';
import type { DailyEntry } from '@/domain/entry';
import { emotionName } from '@/domain/emotions/catalog';

export default function RecordsScreen() {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      setEntries(await listEntries());
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  return <Screen>
    <AppText variant="title">기록</AppText>
    <Button label="그래프로 보기" onPress={() => router.push('/records/graph' as never)} />
    {status === 'loading' ? <Card><AppText accessibilityRole="text">기록을 불러오는 중이에요.</AppText></Card> : null}
    {status === 'error' ? <Card>
      <AppText>기록을 불러오지 못했어요.</AppText>
      <AppText variant="bodySmall" tone="secondary">기기에 저장된 기록은 변경하지 않았어요.</AppText>
      <Button label="다시 시도" variant="subtle" onPress={() => void load()} />
    </Card> : null}
    {status === 'ready' && entries.length === 0 ? <Card><AppText>아직 보여줄 기록이 없어요.</AppText></Card> : null}
    {status === 'ready' ? entries.map((entry) => <Card key={entry.date}>
      <AppText variant="body">{entry.date}</AppText>
      <AppText>{emotionName(entry.emotionId)} · {entry.value ?? '수치 없음'}</AppText>
      {entry.retrospectiveFlag ? <AppText variant="caption" tone="secondary">나중에 남긴 기록이에요.</AppText> : null}
      <Button label="기록 보기" variant="subtle" onPress={() => router.push(`/entry/${entry.date}` as never)} />
    </Card>) : null}
  </Screen>;
}
