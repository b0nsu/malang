import { View, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { AppText, Button, Card } from '@/design-system/components';
import { color, space } from '@/design-system/tokens';

export default function TodayScreen() {
  return <View style={styles.screen}><AppText variant="display">오늘</AppText><Card><AppText variant="body">말랑이를 둘러보고, 마음에 남은 것을 기록할 수 있어요.</AppText><Link href="/entry/emotion" asChild><Button label="오늘 기록하기" /></Link></Card><AppText variant="caption">말랑이의 움직임은 기록으로 남지 않아요.</AppText></View>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: color.bg.canvas, padding: space[6], justifyContent: 'center', gap: space[5] } });
