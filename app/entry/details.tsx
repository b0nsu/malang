import { Alert, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppInput, AppText, Button, Card, Screen, ScreenHeader } from '@/design-system/components';
import { ValuePicker } from '@/design-system/entry-controls';
import { useEntryDraft } from '@/features/entry-draft/store';
import { saveEntry } from '@/data/repositories/entries';
import { isRetrospectiveDate } from '@/domain/entry';
import { emotionName } from '@/domain/emotions/catalog';
import { space } from '@/design-system/tokens';

export default function DetailsScreen() {
  const draft = useEntryDraft();
  const save = async () => {
    if (!draft.emotionId) return router.replace('/entry/emotion');
    try {
      await saveEntry({ date: draft.date, emotionId: draft.emotionId, value: draft.value, note: draft.note || null }, { version: 1, parameters: draft.face, appearance: { baseColor: '#B7D7CF', materialId: 'default', decorationIds: [] } }, { createdAt: new Date().toISOString(), timezoneOffsetMinutes: new Date().getTimezoneOffset(), retrospectiveFlag: isRetrospectiveDate(draft.date) });
      const date = draft.date; draft.reset(); router.replace(`/entry/${date}` as never);
    } catch { Alert.alert('기록하지 못했어요.', '같은 날짜의 기록이 있는지 확인해 주세요.'); }
  };
  return <Screen><ScreenHeader title="하루의 수치와 메모" back={() => router.back()} /><Card><AppText variant="body">둘 다 선택 사항이에요.</AppText><AppText variant="caption" tone="secondary">선택한 감정: {draft.emotionId ? emotionName(draft.emotionId) : '없음'}</AppText><ValuePicker value={draft.value} onChange={draft.setValue} /><View style={styles.note}><AppInput label="한 줄 메모" value={draft.note} onChangeText={draft.setNote} maxLength={120} placeholder="한 줄 메모 · 선택"/><AppText variant="caption" tone="secondary">{draft.note.length}/120</AppText></View></Card><Button label="기록 보기" onPress={save}/></Screen>;
}
const styles = StyleSheet.create({ note: { gap: space[1], alignItems: 'flex-end' } });
