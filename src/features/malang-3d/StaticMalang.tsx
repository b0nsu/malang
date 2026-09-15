import { StyleSheet, View } from 'react-native';
import { color, palette } from '@/design-system/tokens';
import type { FaceSnapshotV1 } from '@/domain/entry';

type Appearance = FaceSnapshotV1['appearance'];

/** A quiet, code-native stand-in while native 3D is unavailable or still loading. */
export function StaticMalang({ appearance }: { appearance?: Appearance }) {
  const baseColor = appearance?.baseColor ?? palette.mint300;
  const mouthHeight = appearance?.materialId === 'soft' ? 8 : 6;
  return <View accessibilityLabel="정적 말랑이 미리보기" style={styles.stage}><View style={[styles.body, { backgroundColor: baseColor }]}><View style={styles.face}><View style={styles.eyes}><View style={styles.eye} /><View style={styles.eye} /></View><View style={[styles.mouth, { height: mouthHeight }]} /></View>{appearance?.decorationIds.includes('sprout') ? <View style={styles.sprout} /> : null}</View></View>;
}

const styles = StyleSheet.create({ stage: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.bg.muted }, body: { width: 142, height: 142, borderRadius: 70, alignItems: 'center', justifyContent: 'center' }, face: { gap: 18, alignItems: 'center' }, eyes: { flexDirection: 'row', gap: 32 }, eye: { width: 12, height: 18, borderRadius: 9, backgroundColor: color.text.primary }, mouth: { width: 38, borderRadius: 10, backgroundColor: color.text.primary }, sprout: { position: 'absolute', top: -20, width: 22, height: 30, borderTopLeftRadius: 22, borderBottomRightRadius: 22, backgroundColor: palette.characterSprout, transform: [{ rotate: '28deg' }] } });
