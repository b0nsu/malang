import { useRef, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { AppInput, AppText, Button, Card, Screen, ScreenHeader } from '@/design-system/components';
import { isLocalDate } from '@/domain/entry';
import { useEntryDraft } from '@/features/entry-draft/store';
import { findEntry } from '@/data/repositories/entries';

export default function NewEntryScreen() {
  const { date, setDate } = useEntryDraft();
  const pending = useRef(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const proceed = async () => {
    if (pending.current) return;
    if (!isLocalDate(date)) { setError('날짜를 YYYY-MM-DD 형식으로 확인해 주세요.'); return; }
    pending.current = true;
    setChecking(true);
    setError(null);
    try {
      const existing = await findEntry(date);
      if (existing) router.replace(`/entry/${date}` as never);
      else router.push('/entry/emotion');
    } catch {
      setError('기록을 확인하지 못했어요. 작성한 내용은 그대로 있어요. 다시 시도해 주세요.');
    } finally {
      pending.current = false;
      setChecking(false);
    }
  };
  return <Screen><ScreenHeader title="기록 날짜" back={checking ? undefined : () => router.back()} /><Card><AppText variant="bodySmall" tone="secondary">오늘이 아닌 날도 기록할 수 있어요.</AppText><AppInput disabled={checking} label="기록 날짜" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />{error ? <View accessibilityRole="alert" accessibilityLiveRegion="polite"><AppText>{error}</AppText></View> : null}<Button label={checking ? '기록 확인 중' : error ? '다시 시도' : '감정 고르기'} disabled={checking} busy={checking} onPress={proceed} /></Card></Screen>;
}
