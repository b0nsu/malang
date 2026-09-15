import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { color, radius, space } from '../tokens';
import { AppText } from './AppText';

export function SelectionCard({ label, detail, selected, neutralVisual = false, onPress, style }: { label: string; detail?: string; selected?: boolean; neutralVisual?: boolean; onPress?: () => void; style?: StyleProp<ViewStyle> }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [styles.selection, selected && styles.selectionSelected, pressed && styles.pressed, style]}>{neutralVisual ? <View accessible={false} style={styles.neutralMark} /> : null}<AppText variant="label">{label}</AppText>{detail ? <AppText variant="caption" tone="secondary">{detail}</AppText> : null}</Pressable>;
}

const styles = StyleSheet.create({ selection: { minHeight: 76, justifyContent: 'center', gap: space[1], padding: space[3], borderRadius: radius.control, borderWidth: 1, borderColor: color.border.default, backgroundColor: color.bg.surface }, selectionSelected: { borderColor: color.action.primary, backgroundColor: color.bg.selected }, neutralMark: { width: 10, height: 10, borderRadius: 5, backgroundColor: color.action.primary, opacity: .45 }, pressed: { opacity: .72 } });
