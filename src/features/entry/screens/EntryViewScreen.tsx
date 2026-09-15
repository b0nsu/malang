import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { AppText, Button, Card } from '@/design-system/components';
import { findEntry } from '@/data/repositories/entries';
import type { DailyEntry } from '@/domain/entry';
import { color, space } from '@/design-system/tokens';
import { emotionName } from '@/domain/emotions/catalog';
import { MalangScene } from '@/features/malang-3d/MalangScene';

export default function EntryViewScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const [entry, setEntry] = useState<DailyEntry | null>();
  useEffect(() => { if (date) findEntry(date).then(setEntry); }, [date]);
  return <View style={styles.screen}><AppText variant="title">{date}의 기록</AppText>{entry ? <><MalangScene face={entry.faceSnapshot.parameters} appearance={entry.faceSnapshot.appearance} /><Card><AppText variant="body">감정: {emotionName(entry.emotionId)}</AppText>{entry.retrospectiveFlag ? <AppText variant="caption" tone="secondary">나중에 남긴 기록이에요.</AppText> : null}{entry.value !== null ? <AppText variant="body">수치: {entry.value}</AppText> : null}{entry.note ? <AppText variant="body">{entry.note}</AppText> : null}</Card></> : <AppText>기록을 찾을 수 없어요.</AppText>}<Button label="기록 목록" onPress={() => router.replace('/records' as never)} /></View>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: color.bg.canvas, padding: space[5], gap: space[4] } });
