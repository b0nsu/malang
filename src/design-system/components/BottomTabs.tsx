import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { color, layout, space } from '../tokens';
import { AppText } from './AppText';

export function BottomTabs({ active, onToday, onRecords, onStudio }: { active: 'today' | 'records' | 'studio'; onToday: () => void; onRecords: () => void; onStudio: () => void }) {
  const tabs = [{ id: 'today' as const, label: '오늘', fn: onToday }, { id: 'records' as const, label: '기록', fn: onRecords }, { id: 'studio' as const, label: '말랑이', fn: onStudio }];
  return <View style={styles.tabs}>{tabs.map((tab) => { const selected = active === tab.id; return <Pressable key={tab.id} accessibilityRole="tab" accessibilityState={{ selected }} onPress={tab.fn} style={styles.tab}><TabIcon name={tab.id} selected={selected} /><AppText variant="caption" tone={selected ? 'primary' : 'tertiary'}>{tab.label}</AppText></Pressable>; })}</View>;
}

function TabIcon({ name, selected }: { name: 'today' | 'records' | 'studio'; selected: boolean }) {
  const stroke = selected ? color.text.primary : color.text.tertiary;
  const common = { stroke, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return <Svg width={24} height={24} viewBox="0 0 24 24" accessible={false}>{name === 'today' ? <><Path {...common} fill="none" d="m3.5 10 8.5-6.5 8.5 6.5v9.5a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V10Z" /><Path {...common} d="M9.5 20.5v-6h5v6" /></> : null}{name === 'records' ? <><Path {...common} fill="none" d="M6 3.5h10.5l2 2v15H6a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1Z" /><Path {...common} d="M8.5 10h7M8.5 14h7" /></> : null}{name === 'studio' ? <><Path {...common} fill="none" d="M12 3.5c5.2 0 8 3.5 8 8.2 0 5.4-3.5 8.8-8 8.8s-8-3.4-8-8.8c0-4.7 2.8-8.2 8-8.2Z" /><Path {...common} d="M8.8 11.5h.1m6.2 0h.1M9.2 16c1.7 1.1 4 1.1 5.7 0" /></> : null}</Svg>;
}

const styles = StyleSheet.create({ tabs: { minHeight: layout.tabBarHeight, borderTopWidth: 1, borderColor: color.border.default, backgroundColor: color.bg.surface, flexDirection: 'row', justifyContent: 'space-around', paddingBottom: space[2] }, tab: { flex: 1, minHeight: layout.hitTarget, alignItems: 'center', justifyContent: 'center', gap: 1 } });
