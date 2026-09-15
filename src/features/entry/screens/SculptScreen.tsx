import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppText, Button, Card } from '@/design-system/components';
import { color, space } from '@/design-system/tokens';
import { MalangScene } from '@/features/malang-3d/MalangScene';
import { useEntryDraft } from '@/features/entry-draft/store';
import { clampFace } from '@/domain/face';

export default function SculptScreen() {
  const { face, previewFace, commitFaceEdit, undoFace, resetFace, faceHistory } = useEntryDraft();
  const gestureStart = useRef(face);
  const begin = () => { gestureStart.current = face; };
  const update = (transform: (start: typeof face, dx: number, dy: number) => typeof face, dx: number, dy: number) => previewFace(clampFace(transform(gestureStart.current, dx, dy)));
  const finish = () => commitFaceEdit(gestureStart.current);
  return <View style={styles.screen}><AppText variant="title">표정 빚기</AppText><MalangScene face={face} /><Card><AppText variant="bodySmall">표시된 조절점을 손가락으로 직접 움직여 보세요.</AppText><View style={styles.board} accessibilityLabel="표정 직접 조절 영역">
    <GestureHandle label="왼쪽 눈썹 중심" hint="위아래로 왼쪽 눈썹 높이를 조절" onStart={begin} onMove={(dx, dy) => update((start) => ({ ...start, brows: { ...start.brows, left: { ...start.brows.left, centerY: start.brows.left.centerY - dy / 90 } } }), dx, dy)} onEnd={finish} />
    <GestureHandle label="오른쪽 눈썹 중심" hint="위아래로 오른쪽 눈썹 높이를 조절" onStart={begin} onMove={(dx, dy) => update((start) => ({ ...start, brows: { ...start.brows, right: { ...start.brows.right, centerY: start.brows.right.centerY - dy / 90 } } }), dx, dy)} onEnd={finish} />
    <GestureHandle label="왼쪽 눈썹 끝" hint="위아래로 왼쪽 눈썹 기울기를 조절" onStart={begin} onMove={(dx, dy) => update((start) => ({ ...start, brows: { ...start.brows, left: { ...start.brows.left, outerY: start.brows.left.outerY - dy / 90 } } }), dx, dy)} onEnd={finish} />
    <GestureHandle label="오른쪽 눈썹 끝" hint="위아래로 오른쪽 눈썹 기울기를 조절" onStart={begin} onMove={(dx, dy) => update((start) => ({ ...start, brows: { ...start.brows, right: { ...start.brows.right, outerY: start.brows.right.outerY - dy / 90 } } }), dx, dy)} onEnd={finish} />
    <GestureHandle label="왼쪽 눈" hint="위아래로 뜸, 좌우로 기울기와 크기를 조절" onStart={begin} onMove={(dx, dy) => update((start) => ({ ...start, eyes: { ...start.eyes, left: { ...start.eyes.left, openness: start.eyes.left.openness - dy / 100, tilt: start.eyes.left.tilt + dx / 120, scaleX: start.eyes.left.scaleX + dx / 160, scaleY: start.eyes.left.scaleY - dy / 160 } } }), dx, dy)} onEnd={finish} />
    <GestureHandle label="오른쪽 눈" hint="위아래로 뜸, 좌우로 기울기와 크기를 조절" onStart={begin} onMove={(dx, dy) => update((start) => ({ ...start, eyes: { ...start.eyes, right: { ...start.eyes.right, openness: start.eyes.right.openness - dy / 100, tilt: start.eyes.right.tilt + dx / 120, scaleX: start.eyes.right.scaleX + dx / 160, scaleY: start.eyes.right.scaleY - dy / 160 } } }), dx, dy)} onEnd={finish} />
    <GestureHandle label="왼쪽 입꼬리" hint="위아래로 왼쪽 입꼬리를 조절" onStart={begin} onMove={(dx, dy) => update((start) => ({ ...start, mouth: { ...start.mouth, leftCornerY: start.mouth.leftCornerY - dy / 90 } }), dx, dy)} onEnd={finish} />
    <GestureHandle label="오른쪽 입꼬리" hint="위아래로 오른쪽 입꼬리를 조절" onStart={begin} onMove={(dx, dy) => update((start) => ({ ...start, mouth: { ...start.mouth, rightCornerY: start.mouth.rightCornerY - dy / 90 } }), dx, dy)} onEnd={finish} />
    <GestureHandle label="입 가운데" hint="위아래로 입 벌어짐을 조절" onStart={begin} onMove={(dx, dy) => update((start) => ({ ...start, mouth: { ...start.mouth, openness: start.mouth.openness - dy / 100 } }), dx, dy)} onEnd={finish} />
  </View><View style={styles.row}><Button label="되돌리기" variant="subtle" onPress={undoFace} /><Button label="처음으로" variant="subtle" onPress={resetFace} /></View><AppText variant="caption">되돌릴 수 있는 조작 {faceHistory.length}개</AppText></Card><View style={styles.row}><Button label="건너뛰기" variant="subtle" onPress={() => router.replace('/entry/details')} /><Button label="다음" onPress={() => router.replace('/entry/details')} /></View></View>;
}

function GestureHandle({ label, hint, onStart, onMove, onEnd }: { label: string; hint: string; onStart: () => void; onMove: (dx: number, dy: number) => void; onEnd: () => void }) {
  const origin = useRef<{ x: number; y: number } | null>(null);
  return <View accessible accessibilityRole="adjustable" accessibilityLabel={label} accessibilityHint={hint} onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => true} onResponderGrant={(event) => { origin.current = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY }; onStart(); }} onResponderMove={(event) => { if (origin.current) onMove(event.nativeEvent.pageX - origin.current.x, event.nativeEvent.pageY - origin.current.y); }} onResponderRelease={onEnd} onResponderTerminate={onEnd} style={styles.handle}><AppText variant="caption">{label}</AppText></View>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: color.bg.canvas, padding: space[5], gap: space[4] }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] }, board: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] }, handle: { minHeight: 44, flexGrow: 1, minWidth: '28%', justifyContent: 'center', alignItems: 'center', borderRadius: 14, backgroundColor: color.bg.selected, paddingHorizontal: space[2] } });
