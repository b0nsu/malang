import { StyleSheet, View } from 'react-native';
import { Camera, DefaultLight, FilamentScene, FilamentView, Model } from 'react-native-filament';
import type { FaceParametersV1 } from '@/domain/face';
const neutralModel = require('../../../assets/models/malang-neutral-v1.glb');
function SceneContents() { return <FilamentView style={styles.canvas}><Camera cameraPosition={[0, 1, 4]} cameraTarget={[0, .9, 0]}/><DefaultLight/><Model source={neutralModel}/></FilamentView>; }
export function MalangScene(_props: { face: FaceParametersV1 }) { return <View accessibilityLabel="말랑이 3D 미리보기" style={styles.container}><FilamentScene><SceneContents/></FilamentScene></View>; }
const styles = StyleSheet.create({ container: { height: 320, overflow: 'hidden', borderRadius: 20 }, canvas: { flex: 1 } });
