import { StyleSheet, View } from 'react-native';
import { color, palette } from '@/design-system/tokens';
import { clampFace, neutralFace, type FaceParametersV1 } from '@/domain/face';
import type { FaceSnapshotV1 } from '@/domain/entry';

type Appearance = FaceSnapshotV1['appearance'];

export function StaticMalang({ face = neutralFace, appearance }: { face?: FaceParametersV1; appearance?: Appearance }) {
  const value = clampFace(face);
  const baseColor = /^#[0-9a-fA-F]{6}$/.test(appearance?.baseColor ?? '') ? appearance!.baseColor : palette.mint300;
  return <View accessibilityLabel="2D 말랑이 미리보기" style={styles.stage}><View style={[styles.body, { backgroundColor: baseColor, width: 142 * (1 + value.face.width * .2), height: 142 * (1 + value.face.length * .2 - value.face.volume * .15), transform: [{ rotate: `${value.face.tilt * 15}deg` }, { skewX: `${value.face.skewX * 10}deg` }] }]}><View style={styles.face}><View style={styles.eyes}>{(['left', 'right'] as const).map(side => <View key={side} style={styles.feature}><View style={[styles.brow, { transform: [{ translateY: -value.brows[side].centerY * 8 }, { rotate: `${value.brows[side].outerY * (side === 'left' ? 20 : -20)}deg` }] }]} /><View style={[styles.eye, { width: 12 * value.eyes[side].scaleX, height: Math.max(2, 18 * value.eyes[side].scaleY * value.eyes[side].openness), transform: [{ rotate: `${-value.eyes[side].tilt * 15}deg` }] }]} /></View>)}</View><View style={[styles.mouth, { height: 6 + value.mouth.openness * 16, transform: [{ rotate: `${(value.mouth.leftCornerY - value.mouth.rightCornerY) * 15}deg` }, { translateY: -(value.mouth.leftCornerY + value.mouth.rightCornerY) * 3 }] }]} /></View>{appearance?.decorationIds.includes('sprout') ? <View style={styles.sprout} /> : null}</View></View>;
}

const styles = StyleSheet.create({ stage: { flex: 1, minHeight: 250, width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: color.bg.muted }, body: { borderRadius: 70, alignItems: 'center', justifyContent: 'center' }, face: { gap: 18, alignItems: 'center' }, eyes: { flexDirection: 'row', gap: 32 }, feature: { width: 20, height: 30, alignItems: 'center', justifyContent: 'center' }, brow: { position: 'absolute', top: -6, width: 18, height: 3, borderRadius: 2, backgroundColor: color.text.primary }, eye: { borderRadius: 9, backgroundColor: color.text.primary }, mouth: { width: 38, borderRadius: 10, backgroundColor: color.text.primary }, sprout: { position: 'absolute', top: -20, width: 22, height: 30, borderTopLeftRadius: 22, borderBottomRightRadius: 22, backgroundColor: palette.characterSprout, transform: [{ rotate: '28deg' }] } });
