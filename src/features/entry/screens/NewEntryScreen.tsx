import { useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { AppInput, AppText, Button, Card, Screen, ScreenHeader } from '@/design-system/components';
import { isLocalDate } from '@/domain/entry';
import { neutralFace } from '@/domain/face';
import { useEntryDraft } from '@/features/entry-draft/store';
import { findEntry } from '@/data/repositories/entries';

export default function NewEntryScreen() {
  const { date, setDate, startFace } = useEntryDraft();
  const [checking, setChecking] = useState(false);

  const proceed = async () => {
    if (checking) return;
    if (!isLocalDate(date)) return Alert.alert('날짜를 확인해 주세요.', 'YYYY-MM-DD 형식으로 입력할 수 있어요.');

    setChecking(true);
    try {
      if (await findEntry(date)) {
        Alert.alert('같은 날짜의 기록이 있어요.', '기존 기록을 이어서 볼게요.');
        return router.replace(`/entry/${date}` as never);
      }
      // A daily expression is always a new, neutral canvas with no undo path
      // back into an abandoned or previous record. Current appearance remains
      // independent and is serialized separately when the entry saves.
      startFace(neutralFace);
      router.push('/entry/emotion');
    } catch {
      Alert.alert('기록 날짜를 확인하지 못했어요.', '입력한 날짜는 그대로 두었어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setChecking(false);
    }
  };

  return <Screen>
    <ScreenHeader title="기록 날짜" back={() => router.back()} />
    <Card>
      <AppText variant="bodySmall" tone="secondary">오늘이 아닌 날도 기록할 수 있어요.</AppText>
      <AppInput label="기록 날짜" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
      <Button label={checking ? '확인하는 중…' : '감정 고르기'} disabled={checking} onPress={proceed} />
    </Card>
  </Screen>;
}
