import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppInput, AppText, Button, Card, Screen, ScreenHeader } from '@/design-system/components';
import { ValuePicker } from '@/design-system/entry-controls';
import { useEntryDraft } from '@/features/entry-draft/store';
import { saveEntry } from '@/data/repositories/entries';
import { isRetrospectiveDate } from '@/domain/entry';
import { emotionName } from '@/domain/emotions/catalog';
import { space } from '@/design-system/tokens';

export default function EntryDetailsScreen() {
  const draft = useEntryDraft();
  const pending = useRef(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    if (pending.current) return;
    const current = useEntryDraft.getState();
    if (!current.emotionId) return router.replace('/entry/emotion');
    pending.current = true;
    setSaving(true);
    setError(null);
    try {
      const now = new Date();
      await saveEntry({ date: current.date, emotionId: current.emotionId, value: current.value, note: current.note || null }, current.getSnapshot(), { createdAt: now.toISOString(), timezoneOffsetMinutes: now.getTimezoneOffset(), retrospectiveFlag: isRetrospectiveDate(current.date) });
    } catch {
      pending.current = false;
      setSaving(false);
      setError('기록하지 못했어요. 작성한 내용은 그대로 있어요. 다시 저장하거나 같은 날짜의 기록을 확인해 주세요.');
      return;
    }
    current.reset();
    router.replace(`/entry/${current.date}` as never);
  };
  return <Screen><ScreenHeader title="하루의 수치와 메모" back={saving ? undefined : () => router.back()} /><Card><AppText variant="body">둘 다 선택 사항이에요.</AppText><AppText variant="caption" tone="secondary">선택한 감정: {draft.emotionId ? emotionName(draft.emotionId) : '없음'}</AppText><ValuePicker disabled={saving} value={draft.value} onChange={draft.setValue} /><View style={styles.note}><AppInput disabled={saving} label="한 줄 메모" value={draft.note} onChangeText={draft.setNote} maxLength={120} placeholder="한 줄 메모 · 선택" /><AppText variant="caption" tone="secondary">{draft.note.length}/120</AppText></View></Card>{error ? <Card><View accessibilityRole="alert" accessibilityLiveRegion="polite"><AppText>{error}</AppText></View><Button label="같은 날짜의 기록 확인" variant="subtle" onPress={() => router.push(`/entry/${draft.date}` as never)} /></Card> : null}<Button label={saving ? '저장하는 중' : error ? '다시 저장' : '기록 저장'} disabled={saving} busy={saving} onPress={save} /></Screen>;
}

const styles = StyleSheet.create({ note: { gap: space[1] } });
