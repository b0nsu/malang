import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppInput, AppText, Screen, ScreenHeader, SelectionCard } from '@/design-system/components';
import { EMOTIONS } from '@/domain/emotions/catalog';
import { useEntryDraft } from '@/features/entry-draft/store';
import { color, space } from '@/design-system/tokens';
export default function EmotionScreen() { const select=useEntryDraft(s=>s.selectEmotion); const [query,setQuery]=useState(''); const emotions=useMemo(()=>EMOTIONS.filter(e=>e.name.includes(query.trim())),[query]); return <Screen scroll={false}><ScreenHeader title="감정 선택하기" back={()=>router.back()}/><View style={styles.intro}><AppText variant="title">오늘 가장 가까운 감정</AppText><AppText variant="bodySmall" tone="secondary">하나만 골라도 기록할 수 있어요.</AppText></View><AppInput label="감정 찾기" value={query} onChangeText={setQuery} placeholder="감정 찾기"/><AppText variant="caption" tone="secondary">{emotions.length} / {EMOTIONS.length}</AppText><FlatList data={emotions} numColumns={2} columnWrapperStyle={styles.row} contentContainerStyle={styles.list} renderItem={({item})=><SelectionCard label={item.name} detail={item.group} onPress={()=>{select(item.id);router.push('/entry/sculpt');}} style={styles.item}/>} keyExtractor={item=>item.id}/></Screen>; }
const styles=StyleSheet.create({intro:{gap:space[1]},list:{gap:space[2],paddingBottom:space[8]},row:{gap:space[2]},item:{flex:1},});
