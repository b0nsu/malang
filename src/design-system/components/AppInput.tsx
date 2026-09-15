import { StyleSheet, TextInput } from 'react-native';
import { color, layout, radius, space, type } from '../tokens';

export function AppInput({ value, onChangeText, placeholder, label, maxLength }: { value: string; onChangeText: (text: string) => void; placeholder: string; label: string; maxLength?: number }) {
  return <TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={color.text.tertiary} maxLength={maxLength} style={styles.input} />;
}

const styles = StyleSheet.create({ input: { minHeight: layout.hitTarget, borderWidth: 1, borderColor: color.border.default, borderRadius: radius.control, paddingHorizontal: space[4], color: color.text.primary, ...type.body, backgroundColor: color.bg.surface } });
