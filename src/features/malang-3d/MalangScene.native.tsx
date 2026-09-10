import { StyleSheet, View } from 'react-native';
import { Camera, DefaultLight, FilamentScene, FilamentView, Model } from 'react-native-filament';
import type { FaceParametersV1 } from '@/domain/face';
const neutralModel = require('../../../assets/models/malang-neutral-v1.glb');
function SceneContents(_props: { face: FaceParametersV1 }) { return <FilamentView style={styles.canvas}><Camera cameraPosition={[0, 1, 4]} cameraTarget={[0, .9, 0]}/><DefaultLight/><Model source={neutralModel}/></FilamentView>; }
/** Stable native renderer. Morph controls are kept outside this draw path until the Filament bridge exposes compatible entity APIs. */
export function MalangScene({ face }: { face: FaceParametersV1 }) { return <View accessibilityLabel="말랑이 3D 미리보기" style={styles.container}><FilamentScene><SceneContents face={face}/></FilamentScene></View>; }
const styles = StyleSheet.create({ container: { height: 320, overflow: 'hidden', borderRadius: 20 }, canvas: { flex: 1 } });
