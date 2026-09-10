import { StyleSheet, View } from 'react-native';
import { Camera, DefaultLight, FilamentScene, FilamentView, Model } from 'react-native-filament';

const neutralModel = require('../../../assets/models/malang-neutral-v1.glb');

function SceneContents() {
  return <FilamentView style={styles.canvas}><Camera /><DefaultLight /><Model source={neutralModel} /></FilamentView>;
}

/** Native-only minimal Phase 0 renderer: GLB load/unload is owned by FilamentScene. */
export function MalangScene() { return <View accessibilityLabel="말랑이 3D 미리보기" style={styles.container}><FilamentScene><SceneContents /></FilamentScene></View>; }
const styles = StyleSheet.create({ container: { height: 320, overflow: 'hidden', borderRadius: 20 }, canvas: { flex: 1 } });
