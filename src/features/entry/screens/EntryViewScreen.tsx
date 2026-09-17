import { useCallback } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { AppText, Button, Card, LoadState, Screen, ScreenHeader } from '@/design-system/components';
import { findEntry } from '@/data/repositories/entries';
import { isLocalDate } from '@/domain/entry';
import { emotionName } from '@/domain/emotions/catalog';
import { MalangScene } from '@/features/malang-3d/MalangScene';
import { useFocusedResource } from '@/features/records/useFocusedResource';

export default function EntryViewScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const validDate = typeof date === 'string' && isLocalDate(date);
  const load = useCallback(() => validDate ? findEntry(date) : Promise.resolve(null), [date, validDate]);
  const { data: entry, loading, error, retry } = useFocusedResource(load);
  return <Screen><ScreenHeader title="하루의 기록" back={() => router.canGoBack() ? router.back() : router.replace('/records' as never)} /><AppText variant="title">{validDate ? `${date}의 기록` : '날짜를 확인해 주세요.'}</AppText><LoadState loading={loading} error={error} onRetry={retry} />{entry ? <><MalangScene face={entry.faceSnapshot.parameters} appearance={entry.faceSnapshot.appearance} /><Card><AppText variant="body">감정: {emotionName(entry.emotionId)}</AppText>{entry.retrospectiveFlag ? <AppText variant="caption" tone="secondary">나중에 남긴 기록이에요.</AppText> : null}{entry.value !== null ? <AppText variant="body">수치: {entry.value}</AppText> : null}{entry.note ? <AppText variant="body">{entry.note}</AppText> : null}</Card></> : !loading && !error ? <Card><AppText>기록을 찾을 수 없어요.</AppText>{validDate ? <Button label="다시 확인" variant="subtle" onPress={retry} /> : null}</Card> : null}<Button label="기록 목록" onPress={() => router.replace('/records' as never)} /></Screen>;
}
