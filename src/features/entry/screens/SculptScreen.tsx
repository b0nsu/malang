import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppText, Button, Card, Screen, ScreenHeader } from '@/design-system/components';
import { color, layout, space } from '@/design-system/tokens';
import { MalangScene } from '@/features/malang-3d/MalangScene';
import { useEntryDraft } from '@/features/entry-draft/store';
import { clampFace } from '@/domain/face';

export default function SculptScreen() {
  const { face, previewFace, commitFaceEdit, undoFace, resetFace, faceHistory, appearance } = useEntryDraft();
  const gestureStart = useRef(face);
  const begin = () => { gestureStart.current = useEntryDraft.getState().face; };
  const update = (transform: (start: typeof face, dx: number, dy: number) => typeof face, dx: number, dy: number) => previewFace(clampFace(transform(gestureStart.current, dx, dy)));
  const finish = () => commitFaceEdit(gestureStart.current);
  return <Screen><ScreenHeader title="표정 빚기" back={() => router.back()} /><MalangScene face={face} appearance={appearance} /><Card><AppText variant="bodySmall">표시된 조절점을 손가락으로 직접 움직여 보세요.</AppText><View style={styles.board} accessibilityLabel="표정 직접 조절 영역">
    <GestureHandle value={face.brows.left.centerY} label="왼쪽 눈썹 중심" hint="위아래로 왼쪽 눈썹 높이를 조절" onStart={begin} onMove={(dx, dy) => update((start) => ({ ...start, brows: { ...start.brows, left: { ...start.brows.left, centerY: start.brows.left.centerY - dy / 90 } } }), dx, dy)} onEnd={finish} />
    <GestureHandle value={face.brows.right.centerY} label="오른쪽 눈썹 중심" hint="위아래로 오른쪽 눈썹 높이를 조절" onStart={begin} onMove={(dx, dy) => update((start) => ({ ...start, brows: { ...start.brows, right: { ...start.brows.right, centerY: start.brows.right.centerY - dy / 90 } } }), dx, dy)} onEnd={finish} />
    <GestureHandle value={face.brows.left.outerY} label="왼쪽 눈썹 끝" hint="위아래로 왼쪽 눈썹 기울기를 조절" onStart={begin} onMove={(dx, dy) => update((start) => ({ ...start, brows: { ...start.brows, left: { ...start.brows.left, outerY: start.brows.left.outerY - dy / 90 } } }), dx, dy)} onEnd={finish} />
    <GestureHandle value={face.brows.right.outerY} label="오른쪽 눈썹 끝" hint="위아래로 오른쪽 눈썹 기울기를 조절" onStart={begin} onMove={(dx, dy) => update((start) => ({ ...start, brows: { ...start.brows, right: { ...start.brows.right, outerY: start.brows.right.outerY - dy / 90 } } }), dx, dy)} onEnd={finish} />
    <GestureHandle value={face.eyes.left.openness} min={0} horizontal label="왼쪽 눈" hint="위아래로 뜸, 좌우로 기울기와 크기를 조절" onStart={begin} onMove={(dx, dy) => update((start) => ({ ...start, eyes: { ...start.eyes, left: { ...start.eyes.left, openness: start.eyes.left.openness - dy / 100, tilt: start.eyes.left.tilt + dx / 120, scaleX: start.eyes.left.scaleX + dx / 160, scaleY: start.eyes.left.scaleY - dy / 160 } } }), dx, dy)} onEnd={finish} />
    <GestureHandle value={face.eyes.right.openness} min={0} horizontal label="오른쪽 눈" hint="위아래로 뜸, 좌우로 기울기와 크기를 조절" onStart={begin} onMove={(dx, dy) => update((start) => ({ ...start, eyes: { ...start.eyes, right: { ...start.eyes.right, openness: start.eyes.right.openness - dy / 100, tilt: start.eyes.right.tilt + dx / 120, scaleX: start.eyes.right.scaleX + dx / 160, scaleY: start.eyes.right.scaleY - dy / 160 } } }), dx, dy)} onEnd={finish} />
    <GestureHandle value={face.mouth.leftCornerY} label="왼쪽 입꼬리" hint="위아래로 왼쪽 입꼬리를 조절" onStart={begin} onMove={(dx, dy) => update((start) => ({ ...start, mouth: { ...start.mouth, leftCornerY: start.mouth.leftCornerY - dy / 90 } }), dx, dy)} onEnd={finish} />
    <GestureHandle value={face.mouth.rightCornerY} label="오른쪽 입꼬리" hint="위아래로 오른쪽 입꼬리를 조절" onStart={begin} onMove={(dx, dy) => update((start) => ({ ...start, mouth: { ...start.mouth, rightCornerY: start.mouth.rightCornerY - dy / 90 } }), dx, dy)} onEnd={finish} />
    <GestureHandle value={face.mouth.openness} min={0} label="입 가운데" hint="위아래로 입 벌어짐을 조절" onStart={begin} onMove={(dx, dy) => update((start) => ({ ...start, mouth: { ...start.mouth, openness: start.mouth.openness - dy / 100 } }), dx, dy)} onEnd={finish} />
  </View><View style={styles.row}><Button label="되돌리기" variant="subtle" disabled={faceHistory.length === 0} onPress={undoFace} /><Button label="처음으로" variant="subtle" onPress={resetFace} /></View><AppText variant="caption">되돌릴 수 있는 조작 {faceHistory.length}개</AppText></Card><View style={styles.row}><Button label="건너뛰기" variant="subtle" onPress={() => router.replace('/entry/details')} /><Button label="다음" onPress={() => router.replace('/entry/details')} /></View></Screen>;
}

export function GestureHandle({ label, hint, value, min = -1, horizontal = false, onStart, onMove, onEnd }: { label: string; hint: string; value: number; min?: number; horizontal?: boolean; onStart: () => void; onMove: (dx: number, dy: number) => void; onEnd: () => void }) {
  const origin = useRef<{ x: number; y: number } | null>(null);
  const adjust = (action: string) => {
    if (!['increment', 'decrement', ...(horizontal ? ['moveLeft', 'moveRight'] : [])].includes(action)) return;
    onStart();
    onMove(action === 'moveRight' ? 12 : action === 'moveLeft' ? -12 : 0, action === 'increment' ? -9 : action === 'decrement' ? 9 : 0);
    onEnd();
  };
  const finish = () => { if (origin.current) { origin.current = null; onEnd(); } };
  return <View accessible accessibilityRole="adjustable" accessibilityLabel={label} accessibilityHint={hint} accessibilityValue={{ min, max: 1, now: value, text: value.toFixed(1) }} accessibilityActions={[{ name: 'increment', label: '위로 조절' }, { name: 'decrement', label: '아래로 조절' }, ...(horizontal ? [{ name: 'moveLeft', label: '왼쪽으로 조절' }, { name: 'moveRight', label: '오른쪽으로 조절' }] : [])]} onAccessibilityAction={event => adjust(event.nativeEvent.actionName)} onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => true} onResponderGrant={(event) => { origin.current = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY }; onStart(); }} onResponderMove={(event) => { if (origin.current) onMove(event.nativeEvent.pageX - origin.current.x, event.nativeEvent.pageY - origin.current.y); }} onResponderRelease={finish} onResponderTerminate={finish} style={styles.handle}><AppText variant="caption">{label}</AppText></View>;
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] }, board: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] }, handle: { minHeight: layout.hitTarget, flexGrow: 1, minWidth: '28%', justifyContent: 'center', alignItems: 'center', borderRadius: 14, backgroundColor: color.bg.selected, paddingHorizontal: space[2] } });
