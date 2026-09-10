import { Platform, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { AppText, Button, Card } from '@/design-system/components';
import { color, space } from '@/design-system/tokens';
import { MalangScene } from '@/features/malang-3d/MalangScene.android';
import { useEntryDraft } from '@/features/entry-draft/store';
import { clampFace } from '@/domain/face';

export default function SculptScreen() {
  const { face, setFace, undoFace, resetFace, faceHistory } = useEntryDraft();
  const adjust = (kind: 'brow'|'eye'|'mouth', amount: number) => {
    if (kind === 'brow') setFace(clampFace({ ...face, brows: { left: { ...face.brows.left, centerY: face.brows.left.centerY + amount }, right: { ...face.brows.right, centerY: face.brows.right.centerY + amount } } }));
    if (kind === 'eye') setFace(clampFace({ ...face, eyes: { left: { ...face.eyes.left, openness: face.eyes.left.openness + amount }, right: { ...face.eyes.right, openness: face.eyes.right.openness + amount } } }));
    if (kind === 'mouth') setFace(clampFace({ ...face, mouth: { ...face.mouth, openness: face.mouth.openness + amount } }));
  };
  return <View style={styles.screen}><AppText variant="title">표정 빚기</AppText>{Platform.OS === 'web' ? <Card><AppText variant="body">3D 미리보기는 Development Build에서 확인할 수 있어요.</AppText></Card> : <MalangScene face={face} />}<Card><AppText variant="bodySmall">원하면 표정을 직접 바꿔볼 수 있어요.</AppText><View style={styles.row}><Button label="눈썹 올리기" variant="subtle" onPress={() => adjust('brow', .1)} /><Button label="눈 뜨기" variant="subtle" onPress={() => adjust('eye', .1)} /><Button label="입 열기" variant="subtle" onPress={() => adjust('mouth', .1)} /></View><View style={styles.row}><Button label="되돌리기" variant="subtle" onPress={undoFace} /><Button label="처음으로" variant="subtle" onPress={resetFace} /></View><AppText variant="caption">되돌릴 수 있는 조작 {faceHistory.length}개</AppText></Card><AppText variant="caption">말랑이의 움직임은 기록으로 옮겨지지 않아요.</AppText><Button label="다음" onPress={() => router.replace('/entry/details')} /></View>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: color.bg.canvas, padding: space[5], gap: space[4] }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] } });
