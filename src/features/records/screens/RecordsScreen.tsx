import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { AppText, Button, Card } from '@/design-system/components';
import { listEntries } from '@/data/repositories/entries';
import type { DailyEntry } from '@/domain/entry';
import { color, space } from '@/design-system/tokens';
import { emotionName } from '@/domain/emotions/catalog';

export default function RecordsScreen() {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  useFocusEffect(useCallback(() => { listEntries().then(setEntries); }, []));
  return <ScrollView contentContainerStyle={styles.screen}><AppText variant="title">기록</AppText><Button label="그래프로 보기" onPress={() => router.push('/records/graph' as never)} />{entries.length === 0 ? <Card><AppText>아직 보여줄 기록이 없어요.</AppText></Card> : entries.map((entry) => <Card key={entry.date}><AppText variant="body">{entry.date}</AppText><AppText>{emotionName(entry.emotionId)} · {entry.value ?? '수치 없음'}</AppText>{entry.retrospectiveFlag ? <AppText variant="caption" tone="secondary">나중에 남긴 기록이에요.</AppText> : null}<Button label="기록 보기" variant="subtle" onPress={() => router.push(`/entry/${entry.date}` as never)} /></Card>)}</ScrollView>;
}

const styles = StyleSheet.create({ screen: { flexGrow: 1, backgroundColor: color.bg.canvas, padding: space[5], gap: space[3] } });
