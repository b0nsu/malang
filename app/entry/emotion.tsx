import { FlatList, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppText, Button, Card } from '@/design-system/components';
import { EMOTIONS } from '@/domain/emotions/catalog';
import { useEntryDraft } from '@/features/entry-draft/store';
import { color, space } from '@/design-system/tokens';

export default function EmotionScreen() {
 const select = useEntryDraft((s) => s.selectEmotion);
 return <View style={styles.screen}><AppText variant="title">오늘 가장 가까운 감정</AppText><AppText variant="bodySmall">하나만 골라도 기록할 수 있어요.</AppText><FlatList data={EMOTIONS} numColumns={2} contentContainerStyle={styles.list} renderItem={({item}) => <Card style={styles.card}><Button variant="subtle" label={item.name} onPress={() => { select(item.id); router.replace('/entry/sculpt'); }} /></Card>} keyExtractor={(item) => item.id}/></View>;
}
const styles=StyleSheet.create({screen:{flex:1,backgroundColor:color.bg.canvas,padding:space[5],gap:space[2]},list:{gap:space[2]},card:{flex:1,margin:space[1]}});
