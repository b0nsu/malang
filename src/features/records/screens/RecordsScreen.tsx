import { router } from 'expo-router';
import { AppText, Button, Card, LoadState, Screen } from '@/design-system/components';
import { listEntries } from '@/data/repositories/entries';
import { emotionName } from '@/domain/emotions/catalog';
import { useFocusedResource } from '../useFocusedResource';

export default function RecordsScreen() {
  const { data: entries, loading, error, retry } = useFocusedResource(listEntries);
  return <Screen><AppText variant="title">기록</AppText><Button label="그래프로 보기" onPress={() => router.push('/records/graph' as never)} /><LoadState loading={loading} error={error} onRetry={retry} />{entries ? entries.length === 0 ? <Card><AppText>아직 보여줄 기록이 없어요.</AppText></Card> : entries.map((entry) => <Card key={entry.date}><AppText variant="body">{entry.date}</AppText><AppText>{emotionName(entry.emotionId)} · {entry.value ?? '수치 없음'}</AppText>{entry.retrospectiveFlag ? <AppText variant="caption" tone="secondary">나중에 남긴 기록이에요.</AppText> : null}<Button label={`${entry.date} 기록 보기`} variant="subtle" onPress={() => router.push(`/entry/${entry.date}` as never)} /></Card>) : null}</Screen>;
}
