import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { AppText, Button, Card } from '@/design-system/components';
import { findEntry } from '@/data/repositories/entries';
import type { DailyEntry } from '@/domain/entry';
import { color, space } from '@/design-system/tokens';
import { emotionName } from '@/domain/emotions/catalog';
export default function EntryScreen() { const { date } = useLocalSearchParams<{ date: string }>(); const [entry, setEntry] = useState<DailyEntry | null>(); useEffect(() => { if (date) findEntry(date).then(setEntry); }, [date]); return <View style={styles.screen}><AppText variant="title">{date}의 기록</AppText>{entry ? <Card><AppText variant="body">감정: {emotionName(entry.emotionId)}</AppText><AppText variant="body">수치: {entry.value ?? '선택 안 함'}</AppText><AppText variant="body">{entry.note ?? '메모 없음'}</AppText></Card> : <AppText>기록을 찾을 수 없어요.</AppText>}<Button label="기록 목록" onPress={() => router.replace('/records' as never)} /></View>; }
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: color.bg.canvas, padding: space[5], gap: space[4] } });
