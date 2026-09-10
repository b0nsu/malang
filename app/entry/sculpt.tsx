import { Platform, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { AppText, Button, Card } from '@/design-system/components';
import { color, space } from '@/design-system/tokens';
import { MalangScene } from '@/features/malang-3d/MalangScene';
export default function SculptScreen() { return <View style={styles.screen}><AppText variant="title">표정 빚기</AppText>{Platform.OS === 'web' ? <Card><AppText variant="body">3D 미리보기는 Development Build에서 확인합니다.</AppText></Card> : <MalangScene />}<Card><AppText variant="caption">말랑이의 움직임은 기록으로 남지 않아요.</AppText></Card><Button label="다음" onPress={() => router.replace('/entry/details')} /></View>; }
const styles=StyleSheet.create({screen:{flex:1,backgroundColor:color.bg.canvas,padding:space[5],gap:space[4]}});
