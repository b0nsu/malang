import { Component, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Camera, DefaultLight, FilamentScene, FilamentView, ModelRenderer, useFilamentContext, useModel, useWorkletEffect } from 'react-native-filament';
import type { FaceParametersV1 } from '@/domain/face';
import type { FaceSnapshotV1 } from '@/domain/entry';
import { morphWeightsForEntity } from './face-mapper';
import { StaticMalang } from './StaticMalang';

const neutralModel = require('../../../assets/models/malang-neutral-v1.glb');
const MORPH_ENTITIES = ['NeutralMesh', 'Eye_L', 'Eye_R', 'Brow_L', 'Brow_R', 'Mouth'] as const;

type Appearance = FaceSnapshotV1['appearance'];
const defaultAppearance: Appearance = { baseColor: '#B7D7CF', materialId: 'default', decorationIds: [] };

const rgba = (hex: string): [number, number, number, number] => {
  const normalized = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex.slice(1) : 'B7D7CF';
  return [0, 2, 4].map((offset) => Number.parseInt(normalized.slice(offset, offset + 2), 16) / 255).concat(1) as [number, number, number, number];
};

function ModelEffects({ face, appearance, model }: { face: FaceParametersV1; appearance: Appearance; model: ReturnType<typeof useModel> }) {
  const { renderableManager, transformManager } = useFilamentContext();
  const weightsByEntity = Object.fromEntries(MORPH_ENTITIES.map((name) => [name, morphWeightsForEntity(name, face)]));
  const baseColor = rgba(appearance.baseColor);
  const roughness = appearance.materialId === 'soft' ? .92 : .62;
  const leftBrowVisible = Math.abs(face.brows.left.centerY) > .01 || Math.abs(face.brows.left.outerY) > .01;
  const rightBrowVisible = Math.abs(face.brows.right.centerY) > .01 || Math.abs(face.brows.right.outerY) > .01;

  useWorkletEffect(() => {
    'worklet';
    if (model.state !== 'loaded') return;

    for (const name of MORPH_ENTITIES) {
      const entity = model.asset.getFirstEntityByName(name);
      if (entity == null) continue;
      const targetCount = model.asset.getMorphTargetCountAt(entity);
      if (targetCount === 0) continue;
      const entityWeights = weightsByEntity[name];
      const weights = Array.from({ length: targetCount }, (_, index) => {
        const targetName = model.asset.getMorphTargetNameAt(entity, index);
        return entityWeights[targetName] ?? 0;
      });
      renderableManager.setMorphWeights(entity, weights, 0);
    }

    const body = model.asset.getFirstEntityByName('NeutralMesh');
    if (body != null) {
      const primitiveCount = renderableManager.getPrimitiveCount(body);
      for (let index = 0; index < primitiveCount; index += 1) {
        const material = renderableManager.getMaterialInstanceAt(body, index);
        material.setFloat4Parameter('baseColorFactor', baseColor);
        material.setFloatParameter('roughnessFactor', roughness);
      }
    }

    const leftEye = model.asset.getFirstEntityByName('Eye_L');
    if (leftEye != null) transformManager.setEntityScale(leftEye, [1.06 * face.eyes.left.scaleX, .86 * face.eyes.left.scaleY, 1.06], false);
    const rightEye = model.asset.getFirstEntityByName('Eye_R');
    if (rightEye != null) transformManager.setEntityScale(rightEye, [1.06 * face.eyes.right.scaleX, .86 * face.eyes.right.scaleY, 1.06], false);

    const leftBrow = model.asset.getFirstEntityByName('Brow_L');
    if (leftBrow != null) transformManager.setEntityScale(leftBrow, leftBrowVisible ? [1, 1, 1] : [.001, .001, .001], false);
    const rightBrow = model.asset.getFirstEntityByName('Brow_R');
    if (rightBrow != null) transformManager.setEntityScale(rightBrow, rightBrowVisible ? [1, 1, 1] : [.001, .001, .001], false);

    const deformRoot = model.asset.getFirstEntityByName('MALANG_DEFORM_ROOT');
    if (deformRoot != null) {
      const transform = transformManager.createIdentityMatrix()
        .rotate(face.face.tilt * .18, [0, 0, 1])
        .translate([face.face.skewX * .08, 0, 0]);
      transformManager.setTransform(deformRoot, transform);
    }
  });

  return null;
}

function SceneContents({ face, appearance }: { face: FaceParametersV1; appearance: Appearance }) {
  const model = useModel(neutralModel);
  return <View style={styles.canvas}>
    <FilamentView style={styles.canvas}>
      <Camera cameraPosition={[0, 1, 4]} cameraTarget={[0, .9, 0]} />
      <DefaultLight />
      <ModelRenderer model={model}>
        <ModelEffects face={face} appearance={appearance} model={model} />
      </ModelRenderer>
    </FilamentView>
    {model.state === 'loading' ? <View pointerEvents="none" style={styles.loading}><StaticMalang appearance={appearance} /></View> : null}
  </View>;
}

class FilamentErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Rendering falls back locally. No emotion or record data leaves the device.
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function MalangScene({ face, appearance = defaultAppearance }: { face: FaceParametersV1; appearance?: Appearance }) {
  const fallback = <StaticMalang appearance={appearance} />;
  return <View accessibilityLabel="말랑이 미리보기" style={styles.container}>
    <FilamentErrorBoundary fallback={fallback}>
      <FilamentScene><SceneContents face={face} appearance={appearance} /></FilamentScene>
    </FilamentErrorBoundary>
    {appearance.decorationIds.includes('sprout') ? <View pointerEvents="none" style={styles.sprout} /> : null}
  </View>;
}

const styles = StyleSheet.create({
  container: { height: 320, overflow: 'hidden', borderRadius: 20 },
  canvas: { flex: 1 },
  loading: { ...StyleSheet.absoluteFill },
  sprout: { position: 'absolute', top: 18, left: '50%', marginLeft: 3, width: 22, height: 30, borderTopLeftRadius: 22, borderBottomRightRadius: 22, backgroundColor: '#779B75', transform: [{ rotate: '28deg' }] },
});
