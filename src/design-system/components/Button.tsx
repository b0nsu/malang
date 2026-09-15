import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { color, layout, radius, space } from '../tokens';
import { AppText } from './AppText';

export function Button({ label, onPress, variant = 'primary', disabled = false, style }: { label: string; onPress?: () => void; variant?: 'primary' | 'subtle' | 'ghost'; disabled?: boolean; style?: StyleProp<ViewStyle> }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, styles[variant], pressed && !disabled && styles.pressed, disabled && styles.disabled, style]}><AppText variant="label" tone="primary">{label}</AppText></Pressable>;
}

export function IconButton({ label, icon, onPress }: { label: string; icon: string; onPress?: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}><AppText variant="heading">{icon}</AppText></Pressable>;
}

const styles = StyleSheet.create({ button: { minHeight: layout.hitTarget, alignItems: 'center', justifyContent: 'center', borderRadius: radius.control, paddingHorizontal: space[5] }, primary: { backgroundColor: color.action.primary }, subtle: { backgroundColor: color.action.subtle }, ghost: { backgroundColor: 'transparent' }, pressed: { opacity: .72 }, disabled: { opacity: .45 }, iconButton: { width: layout.hitTarget, height: layout.hitTarget, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full } });
