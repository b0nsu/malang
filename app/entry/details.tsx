import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { AppText, Button, Card } from '@/design-system/components';
import { useEntryDraft } from '@/features/entry-draft/store';
import { color, space } from '@/design-system/tokens';
export default function DetailsScreen() { const emotion = useEntryDraft(s=>s.emotionId); return <View style={styles.screen}><AppText variant="title">하루의 수치와 메모</AppText><Card><AppText variant="body">수치와 메모는 선택 사항이에요.</AppText><AppText variant="caption">선택한 감정: {emotion ?? '없음'}</AppText></Card><Button label="기록 보기" onPress={() => router.replace('/today')} /></View>; }
const styles=StyleSheet.create({screen:{flex:1,backgroundColor:color.bg.canvas,padding:space[5],gap:space[4]}});
