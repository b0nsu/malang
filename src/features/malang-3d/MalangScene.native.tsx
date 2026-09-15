import { StyleSheet, View } from 'react-native';
import { Camera, DefaultLight, FilamentScene, FilamentView, ModelRenderer, useFilamentContext, useModel, useWorkletEffect } from 'react-native-filament';
import type { FaceParametersV1 } from '@/domain/face';
import type { FaceSnapshotV1 } from '@/domain/entry';
import { morphWeights } from './face-mapper';
import { StaticMalang } from './StaticMalang';

const neutralModel = require('../../../assets/models/malang-neutral-v1.glb');

type Appearance = FaceSnapshotV1['appearance'];
const defaultAppearance: Appearance = { baseColor: '#B7D7CF', materialId: 'default', decorationIds: [] };

const rgba = (hex: string): [number, number, number, number] => {
  const normalized = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex.slice(1) : 'B7D7CF';
  return [0, 2, 4].map((offset) => Number.parseInt(normalized.slice(offset, offset + 2), 16) / 255).concat(1) as [number, number, number, number];
};

function ModelEffects({ face, appearance, model }: { face: FaceParametersV1; appearance: Appearance; model: ReturnType<typeof useModel> }) {
  const { renderableManager } = useFilamentContext();
  const weightsByName = morphWeights(face);
  const baseColor = rgba(appearance.baseColor);
  const roughness = appearance.materialId === 'soft' ? .92 : .62;

  useWorkletEffect(() => {
    'worklet';
    if (model.state !== 'loaded') return;

    for (const entity of model.asset.getRenderableEntities()) {
      const targetCount = model.asset.getMorphTargetCountAt(entity);
      if (targetCount === 0) continue;

      const weights = Array.from({ length: targetCount }, (_, index) => {
        const targetName = model.asset.getMorphTargetNameAt(entity, index);
        return weightsByName[targetName as keyof typeof weightsByName] ?? 0;
      });
      renderableManager.setMorphWeights(entity, weights, 0);
    }

    for (const entity of model.asset.getRenderableEntities()) {
      const primitiveCount = renderableManager.getPrimitiveCount(entity);
      for (let index = 0; index < primitiveCount; index += 1) {
        const material = renderableManager.getMaterialInstanceAt(entity, index);
        material.setFloat4Parameter('baseColorFactor', baseColor);
        material.setFloatParameter('roughnessFactor', roughness);
      }
    }
  });

  return null;
}

function SceneContents({ face, appearance }: { face: FaceParametersV1; appearance: Appearance }) {
  const model = useModel(neutralModel);
  return <View style={styles.canvas}><FilamentView style={styles.canvas}><Camera cameraPosition={[0, 1, 4]} cameraTarget={[0, .9, 0]} /><DefaultLight /><ModelRenderer model={model}><ModelEffects face={face} appearance={appearance} model={model} /></ModelRenderer></FilamentView>{model.state === 'loading' ? <View pointerEvents="none" style={styles.loading}><StaticMalang appearance={appearance} /></View> : null}</View>;
}

export function MalangScene({ face, appearance = defaultAppearance }: { face: FaceParametersV1; appearance?: Appearance }) { return <View accessibilityLabel="말랑이 3D 미리보기" style={styles.container}><FilamentScene><SceneContents face={face} appearance={appearance}/></FilamentScene></View>; }
const styles = StyleSheet.create({ container: { height: 320, overflow: 'hidden', borderRadius: 20 }, canvas: { flex: 1 }, loading: { ...StyleSheet.absoluteFill } });
