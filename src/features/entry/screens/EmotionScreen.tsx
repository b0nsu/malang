import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppInput, AppText, Screen, ScreenHeader, SelectionCard } from '@/design-system/components';
import { EMOTIONS } from '@/domain/emotions/catalog';
import { useEntryDraft } from '@/features/entry-draft/store';
import { space } from '@/design-system/tokens';

export default function EmotionScreen() {
  const select = useEntryDraft((state) => state.selectEmotion);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const emotions = useMemo(() => EMOTIONS.filter((emotion) => !searchOpen || emotion.name.includes(query.trim())), [query, searchOpen]);
  return <Screen scroll={false}><ScreenHeader title="감정 선택하기" back={() => router.back()} /><View style={styles.intro}><AppText variant="title">오늘 가장 가까운 감정</AppText><AppText variant="bodySmall" tone="secondary">하나만 골라도 기록할 수 있어요.</AppText><View style={styles.searchAction}><SelectionCard label={searchOpen ? '감정 찾기 닫기' : '감정 찾기'} detail="목록에서 찾기 어려울 때만 사용해요" onPress={() => setSearchOpen((open) => !open)} /></View>{searchOpen ? <AppInput label="감정 찾기" value={query} onChangeText={setQuery} placeholder="감정 이름 입력" /> : null}</View>{searchOpen ? <AppText variant="caption" tone="secondary">{emotions.length} / {EMOTIONS.length}</AppText> : null}<FlatList data={emotions} numColumns={2} columnWrapperStyle={styles.row} contentContainerStyle={styles.list} renderItem={({ item }) => <SelectionCard label={item.name} detail={item.group} neutralVisual onPress={() => { select(item.id); router.push('/entry/sculpt'); }} style={styles.item} />} keyExtractor={(item) => item.id} /></Screen>;
}

const styles = StyleSheet.create({ intro: { gap: space[1] }, searchAction: { marginTop: space[2] }, list: { gap: space[2], paddingBottom: space[8] }, row: { gap: space[2] }, item: { flex: 1 } });
