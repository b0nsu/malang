import { Alert, StyleSheet, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { AppText, Button, Card } from '@/design-system/components';
import { listEntries } from '@/data/repositories/entries';
import { createBackup } from '@/domain/backup';
import { readBackupFile, restoreBackup, type CollisionPolicy } from '../restore';
import { color, space } from '@/design-system/tokens';
import { useAppearance } from '@/features/appearance/store';

const chooseCollisionPolicy = (count: number): Promise<CollisionPolicy> => new Promise((resolve) => Alert.alert('같은 날짜의 기록이 있어요.', `${count}개 날짜에서 선택이 필요해요.`, [{ text: '취소', style: 'cancel', onPress: () => resolve('cancel') }, { text: '기기 기록 유지', onPress: () => resolve('keep') }, { text: '백업 기록으로 바꾸기', style: 'destructive', onPress: () => resolve('replace') }], { cancelable: true, onDismiss: () => resolve('cancel') }));

export default function DataSettingsScreen() {
  const appearance = useAppearance((state) => state.appearance);
  const setAppearance = useAppearance((state) => state.setAppearance);
  const exportBackup = async () => { try { const backup = createBackup(await listEntries(), appearance); const uri = `${FileSystem.cacheDirectory}malang-backup.malang.json`; await FileSystem.writeAsStringAsync(uri, JSON.stringify(backup)); await Sharing.shareAsync(uri); } catch { Alert.alert('내보내지 못했어요.', '다시 시도해 주세요.'); } };
  const importBackup = async () => { try { const result = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true }); if (result.canceled) return; const backup = await readBackupFile(result.assets[0]); const preview = await restoreBackup(backup, chooseCollisionPolicy); if (!preview) return; setAppearance(backup.appearance); Alert.alert('가져왔어요.', `${preview.additions.length}개의 새 기록과 현재 외형을 불러왔어요.`); } catch { Alert.alert('백업 파일을 읽지 못했어요.', '다른 파일을 선택해 주세요.'); } };
  return <View style={styles.screen}><AppText variant="title">데이터</AppText><Card><AppText>기록은 이 기기에 저장돼요. 백업 파일에는 기록 내용이 들어갈 수 있어요.</AppText><Button label="백업 내보내기" onPress={exportBackup} /><Button label="백업 가져오기" variant="subtle" onPress={importBackup} /></Card></View>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: color.bg.canvas, padding: space[5], gap: space[3] } });
