import { ScrollView, StyleSheet, View } from 'react-native';
import { entryValues, entryValueLabel } from '@/domain/value';
import { Button, AppText } from './components';
import { space } from './tokens';

export function ValuePicker({ value, onChange, disabled = false }: { value: number | null; onChange: (value: number | null) => void; disabled?: boolean }) {
  return <View accessibilityLabel="하루 수치" style={styles.wrap}><View style={styles.summary}><AppText variant="label">하루 수치</AppText><AppText variant="caption" tone="secondary">{entryValueLabel(value)}</AppText></View><Button disabled={disabled} label="선택 안 함" selected={value === null} variant={value === null ? 'primary' : 'subtle'} onPress={() => onChange(null)} /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.values}>{entryValues.map(item => <Button disabled={disabled} key={item} label={entryValueLabel(item)} selected={value === item} variant={value === item ? 'primary' : 'subtle'} onPress={() => onChange(item)} />)}</ScrollView></View>;
}
const styles = StyleSheet.create({ wrap: { gap: space[2] }, summary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, values: { gap: space[2], paddingRight: space[4] } });
