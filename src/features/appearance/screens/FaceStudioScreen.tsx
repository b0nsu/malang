import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppInput, AppText, Button, Card, Screen, ScreenHeader } from '@/design-system/components';
import { useAppearance } from '@/features/appearance/store';
import { clamp, clampFace, type FaceParametersV1 } from '@/domain/face';
import { MalangScene } from '@/features/malang-3d/MalangScene';
import { color, layout, space } from '@/design-system/tokens';

const colors = [
  { value: '#B7D7CF', label: '소프트 민트' },
  { value: '#A8A0C7', label: '라벤더' },
  { value: '#E8BEB0', label: '소프트 피치' },
  { value: '#E6D39B', label: '버터' },
] as const;
const materials = [
  { value: 'default', label: '말랑' },
  { value: 'soft', label: '포근 매트' },
] as const;
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export default function FaceStudioScreen() {
  const { face, appearance, setFace, setAppearance } = useAppearance();
  const [colorDraft, setColorDraft] = useState(appearance.baseColor);
  const update = (change: (current: FaceParametersV1) => FaceParametersV1) => setFace(clampFace(change(face)));
  const toggleSprout = () => setAppearance({ ...appearance, decorationIds: appearance.decorationIds.includes('sprout') ? [] : ['sprout'] });

  useEffect(() => {
    setColorDraft(appearance.baseColor);
  }, [appearance.baseColor]);

  const changeCustomColor = (value: string) => {
    setColorDraft(value);
    if (HEX_COLOR.test(value)) setAppearance({ ...appearance, baseColor: value.toUpperCase() });
  };

  return <Screen>
    <ScreenHeader title="말랑이 꾸미기" back={() => router.back()} />
    <AppText variant="bodySmall" tone="secondary">현재 모습은 이미 쓴 기록을 바꾸지 않아요. 막대를 좌우로 끌어 세밀하게 조절할 수 있어요.</AppText>
    <MalangScene face={face} appearance={appearance} />
    <StudioSection title="표정">
      <FaceControl label="왼쪽 눈썹 중심 높이" value={face.brows.left.centerY} onChange={(value) => update((current) => ({ ...current, brows: { ...current.brows, left: { ...current.brows.left, centerY: value } } }))} />
      <FaceControl label="왼쪽 눈썹 끝 높이" value={face.brows.left.outerY} onChange={(value) => update((current) => ({ ...current, brows: { ...current.brows, left: { ...current.brows.left, outerY: value } } }))} />
      <FaceControl label="오른쪽 눈썹 중심 높이" value={face.brows.right.centerY} onChange={(value) => update((current) => ({ ...current, brows: { ...current.brows, right: { ...current.brows.right, centerY: value } } }))} />
      <FaceControl label="오른쪽 눈썹 끝 높이" value={face.brows.right.outerY} onChange={(value) => update((current) => ({ ...current, brows: { ...current.brows, right: { ...current.brows.right, outerY: value } } }))} />
      <FaceControl label="왼쪽 눈 뜸" value={face.eyes.left.openness} min={0} max={1} onChange={(value) => update((current) => ({ ...current, eyes: { ...current.eyes, left: { ...current.eyes.left, openness: value } } }))} />
      <FaceControl label="왼쪽 눈 기울기" value={face.eyes.left.tilt} onChange={(value) => update((current) => ({ ...current, eyes: { ...current.eyes, left: { ...current.eyes.left, tilt: value } } }))} />
      <FaceControl label="왼쪽 눈 너비" value={face.eyes.left.scaleX} min={0} max={2} onChange={(value) => update((current) => ({ ...current, eyes: { ...current.eyes, left: { ...current.eyes.left, scaleX: value } } }))} />
      <FaceControl label="왼쪽 눈 높이" value={face.eyes.left.scaleY} min={0} max={2} onChange={(value) => update((current) => ({ ...current, eyes: { ...current.eyes, left: { ...current.eyes.left, scaleY: value } } }))} />
      <FaceControl label="오른쪽 눈 뜸" value={face.eyes.right.openness} min={0} max={1} onChange={(value) => update((current) => ({ ...current, eyes: { ...current.eyes, right: { ...current.eyes.right, openness: value } } }))} />
      <FaceControl label="오른쪽 눈 기울기" value={face.eyes.right.tilt} onChange={(value) => update((current) => ({ ...current, eyes: { ...current.eyes, right: { ...current.eyes.right, tilt: value } } }))} />
      <FaceControl label="오른쪽 눈 너비" value={face.eyes.right.scaleX} min={0} max={2} onChange={(value) => update((current) => ({ ...current, eyes: { ...current.eyes, right: { ...current.eyes.right, scaleX: value } } }))} />
      <FaceControl label="오른쪽 눈 높이" value={face.eyes.right.scaleY} min={0} max={2} onChange={(value) => update((current) => ({ ...current, eyes: { ...current.eyes, right: { ...current.eyes.right, scaleY: value } } }))} />
      <FaceControl label="왼쪽 입꼬리" value={face.mouth.leftCornerY} onChange={(value) => update((current) => ({ ...current, mouth: { ...current.mouth, leftCornerY: value } }))} />
      <FaceControl label="오른쪽 입꼬리" value={face.mouth.rightCornerY} onChange={(value) => update((current) => ({ ...current, mouth: { ...current.mouth, rightCornerY: value } }))} />
      <FaceControl label="입 벌어짐" value={face.mouth.openness} min={0} max={1} onChange={(value) => update((current) => ({ ...current, mouth: { ...current.mouth, openness: value } }))} />
    </StudioSection>
    <StudioSection title="얼굴 형태">
      {(['width', 'length', 'skewX', 'tilt', 'volume'] as const).map((axis) => <FaceControl
        key={axis}
        label={{ width: '너비', length: '길이', skewX: '좌우 비틀림', tilt: '기울기', volume: '볼륨' }[axis]}
        value={face.face[axis]}
        onChange={(value) => update((current) => ({ ...current, face: { ...current.face, [axis]: value } }))}
      />)}
    </StudioSection>
    <StudioSection title="색과 재질">
      <AppText variant="caption" tone="secondary">기본 색</AppText>
      <View style={styles.choices}>{colors.map(({ value, label }) => <Button key={value} label={appearance.baseColor === value ? `${label} · 선택됨` : label} variant="subtle" onPress={() => setAppearance({ ...appearance, baseColor: value })} />)}</View>
      <View style={styles.customColor}>
        <AppInput label="직접 색상" value={colorDraft} onChangeText={changeCustomColor} maxLength={7} placeholder="#B7D7CF" />
        <AppText variant="caption" tone={HEX_COLOR.test(colorDraft) ? 'secondary' : 'tertiary'}>6자리 HEX 색상(예: #B7D7CF)을 입력할 수 있어요.</AppText>
      </View>
      <AppText variant="caption" tone="secondary">재질</AppText>
      <View style={styles.choices}>{materials.map(({ value, label }) => <Button key={value} label={appearance.materialId === value ? `${label} · 선택됨` : label} variant="subtle" onPress={() => setAppearance({ ...appearance, materialId: value })} />)}</View>
    </StudioSection>
    <StudioSection title="장식">
      <Button label={appearance.decorationIds.includes('sprout') ? '새싹 장식 해제' : '새싹 장식 추가'} variant="subtle" onPress={toggleSprout} />
    </StudioSection>
  </Screen>;
}

function StudioSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <Card><AppText variant="heading">{title}</AppText><View style={styles.section}>{children}</View></Card>;
}

function FaceControl({ label, value, onChange, min = -1, max = 1 }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number }) {
  const start = useRef<{ x: number; value: number } | null>(null);
  const percent = ((value - min) / (max - min)) * 100;
  return <View
    accessible
    accessibilityRole="adjustable"
    accessibilityLabel={label}
    accessibilityValue={{ min, max, now: value }}
    accessibilityActions={[{ name: 'increment', label: `${label} 늘리기` }, { name: 'decrement', label: `${label} 줄이기` }]}
    onAccessibilityAction={(event) => onChange(clamp(value + (event.nativeEvent.actionName === 'increment' ? 0.1 : -0.1), min, max))}
    onStartShouldSetResponder={() => true}
    onMoveShouldSetResponder={() => true}
    onResponderGrant={(event) => { start.current = { x: event.nativeEvent.pageX, value }; }}
    onResponderMove={(event) => { if (start.current) onChange(clamp(start.current.value + (event.nativeEvent.pageX - start.current.x) / 160, min, max)); }}
    onResponderRelease={() => { start.current = null; }}
    onResponderTerminate={() => { start.current = null; }}
    style={styles.control}
  >
    <View style={styles.controlHeading}><AppText variant="label">{label}</AppText><AppText variant="caption" tone="secondary">{value.toFixed(1)}</AppText></View>
    <View style={styles.track}><View style={[styles.fill, { width: `${percent}%` }]} /></View>
  </View>;
}

const styles = StyleSheet.create({
  section: { gap: space[3], marginTop: space[3] },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  customColor: { gap: space[1] },
  control: { minHeight: layout.hitTarget, gap: space[1], justifyContent: 'center' },
  controlHeading: { flexDirection: 'row', justifyContent: 'space-between' },
  track: { height: 8, borderRadius: 99, backgroundColor: color.bg.selected, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 99, backgroundColor: color.action.primary },
});
