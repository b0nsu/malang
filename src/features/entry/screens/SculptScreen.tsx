import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppText, Button, Card } from '@/design-system/components';
import { color, layout, space } from '@/design-system/tokens';
import { MalangScene } from '@/features/malang-3d/MalangScene';
import { useEntryDraft } from '@/features/entry-draft/store';
import { useAppearance } from '@/features/appearance/store';
import { clampFace, type FaceParametersV1 } from '@/domain/face';

type FaceTransform = (start: FaceParametersV1, dx: number, dy: number) => FaceParametersV1;

export default function SculptScreen() {
  const { face, previewFace, commitFaceEdit, undoFace, resetFace, faceHistory } = useEntryDraft();
  const appearance = useAppearance((state) => state.appearance);
  const gestureStart = useRef(face);
  const gestureChanged = useRef(false);

  const begin = () => {
    gestureStart.current = face;
    gestureChanged.current = false;
  };

  const update = (transform: FaceTransform, dx: number, dy: number) => {
    gestureChanged.current = true;
    previewFace(clampFace(transform(gestureStart.current, dx, dy)));
  };

  const finish = () => {
    if (gestureChanged.current) commitFaceEdit(gestureStart.current);
    gestureChanged.current = false;
  };

  const nudge = (transform: FaceTransform, dx: number, dy: number) => {
    begin();
    update(transform, dx, dy);
    finish();
  };

  const browLeftCenter: FaceTransform = (start, _dx, dy) => ({ ...start, brows: { ...start.brows, left: { ...start.brows.left, centerY: start.brows.left.centerY - dy / 90 } } });
  const browRightCenter: FaceTransform = (start, _dx, dy) => ({ ...start, brows: { ...start.brows, right: { ...start.brows.right, centerY: start.brows.right.centerY - dy / 90 } } });
  const browLeftOuter: FaceTransform = (start, _dx, dy) => ({ ...start, brows: { ...start.brows, left: { ...start.brows.left, outerY: start.brows.left.outerY - dy / 90 } } });
  const browRightOuter: FaceTransform = (start, _dx, dy) => ({ ...start, brows: { ...start.brows, right: { ...start.brows.right, outerY: start.brows.right.outerY - dy / 90 } } });
  const eyeLeft: FaceTransform = (start, dx, dy) => ({ ...start, eyes: { ...start.eyes, left: { ...start.eyes.left, openness: start.eyes.left.openness - dy / 100, tilt: start.eyes.left.tilt + dx / 120, scaleX: start.eyes.left.scaleX + dx / 160, scaleY: start.eyes.left.scaleY - dy / 160 } } });
  const eyeRight: FaceTransform = (start, dx, dy) => ({ ...start, eyes: { ...start.eyes, right: { ...start.eyes.right, openness: start.eyes.right.openness - dy / 100, tilt: start.eyes.right.tilt + dx / 120, scaleX: start.eyes.right.scaleX + dx / 160, scaleY: start.eyes.right.scaleY - dy / 160 } } });
  const mouthLeft: FaceTransform = (start, _dx, dy) => ({ ...start, mouth: { ...start.mouth, leftCornerY: start.mouth.leftCornerY - dy / 90 } });
  const mouthRight: FaceTransform = (start, _dx, dy) => ({ ...start, mouth: { ...start.mouth, rightCornerY: start.mouth.rightCornerY - dy / 90 } });
  const mouthOpen: FaceTransform = (start, _dx, dy) => ({ ...start, mouth: { ...start.mouth, openness: start.mouth.openness - dy / 100 } });

  return <View style={styles.screen}>
    <AppText variant="title">표정 빚기</AppText>
    <MalangScene face={face} appearance={appearance} />
    <Card>
      <AppText variant="bodySmall">표시된 조절점을 손가락으로 직접 움직여 보세요.</AppText>
      <View style={styles.board} accessibilityLabel="표정 직접 조절 영역">
        <GestureHandle label="왼쪽 눈썹 중심" hint="위아래로 왼쪽 눈썹 높이를 조절" onStart={begin} onMove={(dx, dy) => update(browLeftCenter, dx, dy)} onEnd={finish} onIncrement={() => nudge(browLeftCenter, 0, -9)} onDecrement={() => nudge(browLeftCenter, 0, 9)} />
        <GestureHandle label="오른쪽 눈썹 중심" hint="위아래로 오른쪽 눈썹 높이를 조절" onStart={begin} onMove={(dx, dy) => update(browRightCenter, dx, dy)} onEnd={finish} onIncrement={() => nudge(browRightCenter, 0, -9)} onDecrement={() => nudge(browRightCenter, 0, 9)} />
        <GestureHandle label="왼쪽 눈썹 끝" hint="위아래로 왼쪽 눈썹 기울기를 조절" onStart={begin} onMove={(dx, dy) => update(browLeftOuter, dx, dy)} onEnd={finish} onIncrement={() => nudge(browLeftOuter, 0, -9)} onDecrement={() => nudge(browLeftOuter, 0, 9)} />
        <GestureHandle label="오른쪽 눈썹 끝" hint="위아래로 오른쪽 눈썹 기울기를 조절" onStart={begin} onMove={(dx, dy) => update(browRightOuter, dx, dy)} onEnd={finish} onIncrement={() => nudge(browRightOuter, 0, -9)} onDecrement={() => nudge(browRightOuter, 0, 9)} />
        <GestureHandle label="왼쪽 눈" hint="위아래로 뜸과 높이를, 좌우로 기울기와 너비를 조절" onStart={begin} onMove={(dx, dy) => update(eyeLeft, dx, dy)} onEnd={finish} onIncrement={() => nudge(eyeLeft, 0, -10)} onDecrement={() => nudge(eyeLeft, 0, 10)} onMoveLeft={() => nudge(eyeLeft, -12, 0)} onMoveRight={() => nudge(eyeLeft, 12, 0)} />
        <GestureHandle label="오른쪽 눈" hint="위아래로 뜸과 높이를, 좌우로 기울기와 너비를 조절" onStart={begin} onMove={(dx, dy) => update(eyeRight, dx, dy)} onEnd={finish} onIncrement={() => nudge(eyeRight, 0, -10)} onDecrement={() => nudge(eyeRight, 0, 10)} onMoveLeft={() => nudge(eyeRight, -12, 0)} onMoveRight={() => nudge(eyeRight, 12, 0)} />
        <GestureHandle label="왼쪽 입꼬리" hint="위아래로 왼쪽 입꼬리를 조절" onStart={begin} onMove={(dx, dy) => update(mouthLeft, dx, dy)} onEnd={finish} onIncrement={() => nudge(mouthLeft, 0, -9)} onDecrement={() => nudge(mouthLeft, 0, 9)} />
        <GestureHandle label="오른쪽 입꼬리" hint="위아래로 오른쪽 입꼬리를 조절" onStart={begin} onMove={(dx, dy) => update(mouthRight, dx, dy)} onEnd={finish} onIncrement={() => nudge(mouthRight, 0, -9)} onDecrement={() => nudge(mouthRight, 0, 9)} />
        <GestureHandle label="입 가운데" hint="위아래로 입 벌어짐을 조절" onStart={begin} onMove={(dx, dy) => update(mouthOpen, dx, dy)} onEnd={finish} onIncrement={() => nudge(mouthOpen, 0, -10)} onDecrement={() => nudge(mouthOpen, 0, 10)} />
      </View>
      <View style={styles.row}>
        <Button label="되돌리기" variant="subtle" disabled={faceHistory.length === 0} onPress={undoFace} />
        <Button label="처음으로" variant="subtle" onPress={resetFace} />
      </View>
      <AppText variant="caption">되돌릴 수 있는 조작 {faceHistory.length}개</AppText>
    </Card>
    <View style={styles.row}>
      <Button label="건너뛰기" variant="subtle" onPress={() => router.replace('/entry/details' as never)} />
      <Button label="다음" onPress={() => router.replace('/entry/details' as never)} />
    </View>
  </View>;
}

function GestureHandle({ label, hint, onStart, onMove, onEnd, onIncrement, onDecrement, onMoveLeft, onMoveRight }: {
  label: string;
  hint: string;
  onStart: () => void;
  onMove: (dx: number, dy: number) => void;
  onEnd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
}) {
  const origin = useRef<{ x: number; y: number } | null>(null);
  const end = () => {
    origin.current = null;
    onEnd();
  };
  const accessibilityActions = [
    { name: 'increment', label: `${label} 올리기` },
    { name: 'decrement', label: `${label} 내리기` },
    ...(onMoveLeft ? [{ name: 'moveLeft', label: `${label} 왼쪽으로 조절` }] : []),
    ...(onMoveRight ? [{ name: 'moveRight', label: `${label} 오른쪽으로 조절` }] : []),
  ];

  return <View
    accessible
    accessibilityRole="adjustable"
    accessibilityLabel={label}
    accessibilityHint={hint}
    accessibilityActions={accessibilityActions}
    onAccessibilityAction={(event) => {
      if (event.nativeEvent.actionName === 'increment') onIncrement();
      if (event.nativeEvent.actionName === 'decrement') onDecrement();
      if (event.nativeEvent.actionName === 'moveLeft') onMoveLeft?.();
      if (event.nativeEvent.actionName === 'moveRight') onMoveRight?.();
    }}
    onStartShouldSetResponder={() => true}
    onMoveShouldSetResponder={() => true}
    onResponderGrant={(event) => {
      origin.current = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY };
      onStart();
    }}
    onResponderMove={(event) => {
      if (origin.current) onMove(event.nativeEvent.pageX - origin.current.x, event.nativeEvent.pageY - origin.current.y);
    }}
    onResponderRelease={end}
    onResponderTerminate={end}
    style={styles.handle}
  >
    <AppText variant="caption">{label}</AppText>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg.canvas, padding: space[5], gap: space[4] },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  board: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  handle: { minHeight: layout.hitTarget, flexGrow: 1, minWidth: '28%', justifyContent: 'center', alignItems: 'center', borderRadius: 14, backgroundColor: color.bg.selected, paddingHorizontal: space[2] },
});
