import { useState } from 'react';
import { Alert } from 'react-native';
import Constants from 'expo-constants';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { router } from 'expo-router';
import { AppText, Button, Card, Screen, ScreenHeader } from '@/design-system/components';
import { listEntries, replaceEntries } from '@/data/repositories/entries';
import { createBackup, parseBackup, previewImport } from '@/domain/backup';
import { useAppearance } from '@/features/appearance/store';

const MAX_BACKUP_BYTES = 25 * 1024 * 1024;

const chooseCollisionPolicy = (count: number): Promise<'keep' | 'replace' | 'cancel'> => new Promise((resolve) => Alert.alert(
  '같은 날짜의 기록이 있어요.',
  `${count}개 날짜에서 선택이 필요해요.`,
  [
    { text: '취소', style: 'cancel', onPress: () => resolve('cancel') },
    { text: '기기 기록 유지', onPress: () => resolve('keep') },
    { text: '백업 기록으로 바꾸기', style: 'destructive', onPress: () => resolve('replace') },
  ],
  { cancelable: true, onDismiss: () => resolve('cancel') },
));

async function readBackupFile(uri: string) {
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) throw new Error('Backup file does not exist.');
  if (info.size > MAX_BACKUP_BYTES) throw new Error('Backup file is too large.');
  return FileSystem.readAsStringAsync(uri);
}

export default function DataSettingsScreen() {
  const appearance = useAppearance((state) => state.appearance);
  const setAppearance = useAppearance((state) => state.setAppearance);
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);

  const exportBackup = async () => {
    if (busy) return;
    setBusy('export');
    try {
      if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is unavailable.');
      const appVersion = Constants.expoConfig?.version ?? 'unknown';
      const backup = createBackup(await listEntries(), appearance, appVersion);
      const date = new Date().toISOString().slice(0, 10);
      const uri = `${FileSystem.cacheDirectory}malang-backup-${date}.malang.json`;
      await FileSystem.writeAsStringAsync(uri, JSON.stringify(backup));
      await Sharing.shareAsync(uri, { mimeType: 'application/json', dialogTitle: 'MALANG 백업 내보내기' });
    } catch {
      Alert.alert('내보내지 못했어요.', '기록은 그대로 보관되어 있어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setBusy(null);
    }
  };

  const importBackup = async () => {
    if (busy) return;
    setBusy('import');
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (asset.size !== undefined && asset.size > MAX_BACKUP_BYTES) throw new Error('Backup file is too large.');

      const raw = await readBackupFile(asset.uri);
      const backup = parseBackup(JSON.parse(raw));
      const existing = await listEntries();
      const preview = previewImport(backup, existing.map((entry) => entry.date));
      const policy = preview.collisions.length ? await chooseCollisionPolicy(preview.collisions.length) : 'keep';
      if (policy === 'cancel') return;

      const replaceDates = policy === 'replace' ? new Set(preview.collisions.map((entry) => entry.date)) : new Set<string>();
      await replaceEntries(backup.entries, replaceDates);
      setAppearance(backup.appearance);
      const replacedCount = policy === 'replace' ? preview.collisions.length : 0;
      Alert.alert('가져왔어요.', `새 기록 ${preview.additions.length}개${replacedCount ? `, 교체한 기록 ${replacedCount}개` : ''}와 현재 외형을 불러왔어요.`);
    } catch (error) {
      const tooLarge = error instanceof Error && error.message.includes('too large');
      Alert.alert(
        '백업 파일을 읽지 못했어요.',
        tooLarge ? '백업 파일이 너무 커서 안전하게 열 수 없어요.' : '손상되었거나 지원하지 않는 백업 파일인지 확인해 주세요.',
      );
    } finally {
      setBusy(null);
    }
  };

  return <Screen>
    <ScreenHeader title="데이터" back={() => router.back()} />
    <Card>
      <AppText>기록은 이 기기에 저장돼요. 백업 파일에는 기록 내용이 들어갈 수 있어요.</AppText>
      <Button label={busy === 'export' ? '내보내는 중…' : '백업 내보내기'} disabled={busy !== null} onPress={exportBackup} />
      <Button label={busy === 'import' ? '가져오는 중…' : '백업 가져오기'} disabled={busy !== null} variant="subtle" onPress={importBackup} />
    </Card>
  </Screen>;
}
