import { Slot, router, usePathname } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { BottomTabs } from '@/design-system/components';
import { color } from '@/design-system/tokens';

export default function TabLayout() {
  const pathname = usePathname();
  const active = pathname.startsWith('/records') ? 'records' : pathname.startsWith('/face-studio') ? 'studio' : 'today';

  return <View style={styles.root}>
    <View style={styles.content}><Slot /></View>
    <BottomTabs
      active={active}
      onToday={() => router.replace('/today' as never)}
      onRecords={() => router.replace('/records' as never)}
      onStudio={() => router.replace('/face-studio' as never)}
    />
  </View>;
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: color.bg.canvas }, content: { flex: 1 } });
