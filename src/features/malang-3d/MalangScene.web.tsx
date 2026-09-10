import { StyleSheet, View } from 'react-native';
import type { FaceParametersV1 } from '@/domain/face';
import { AppText } from '@/design-system/components';
import { color, radius, space } from '@/design-system/tokens';
/** Browser-safe fallback: actual renderer is available in the native Development Build. */
export function MalangScene({ face }: { face: FaceParametersV1 }) { return <View accessibilityLabel="말랑이 미리보기" style={styles.container}><AppText variant="title">●</AppText><AppText variant="bodySmall">눈 {face.eyes.left.openness.toFixed(1)} · 입 {face.mouth.openness.toFixed(1)}</AppText><AppText variant="caption" tone="secondary">3D 미리보기는 Development Build에서 표시돼요.</AppText></View>; }
const styles=StyleSheet.create({container:{height:220,borderRadius:radius.card,backgroundColor:color.bg.muted,alignItems:'center',justifyContent:'center',gap:space[2]}});
