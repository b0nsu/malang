import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Camera, DefaultLight, FilamentScene, FilamentView, ModelRenderer, useFilamentContext, useModel } from 'react-native-filament';
import type { FaceParametersV1 } from '@/domain/face';
import type { FaceSnapshotV1 } from '@/domain/entry';
import { defaultAppearance } from '@/features/appearance/store';
import { bodyColor, eyeScale, morphWeights } from './face-mapper';
import { StaticMalang } from './StaticMalang';

type Props = { face: FaceParametersV1; appearance?: FaceSnapshotV1['appearance'] };
const neutralModel = require('../../../assets/models/malang-neutral-v1.glb');

function ModelEffects({ face, appearance = defaultAppearance, model, onReady, onFailure }: Props & { model: ReturnType<typeof useModel>; onReady: () => void; onFailure: () => void }) {
  const { renderableManager, nameComponentManager, transformManager, workletContext } = useFilamentContext();
  const asset = model.state === 'loaded' ? model.asset : undefined;
  const weights = useMemo(() => Object.fromEntries(['NeutralMesh', 'Eye_L', 'Eye_R', 'Brow_L', 'Brow_R', 'Mouth'].map(name => [name, morphWeights(face, name)])), [face]);
  const scales = useMemo(() => ({ Eye_L: eyeScale(face, 'left'), Eye_R: eyeScale(face, 'right') }), [face]);
  const color = useMemo(() => bodyColor(appearance.baseColor), [appearance.baseColor]);
  const roughness = appearance.materialId === 'soft' ? .92 : .62;

  useEffect(() => {
    if (!asset) return;
    let active = true;
    workletContext.runAsync(() => {
      'worklet';
      for (const entity of asset.getRenderableEntities()) {
        const name = nameComponentManager.getEntityName(entity) ?? '';
        const count = asset.getMorphTargetCountAt(entity);
        if (count > 0) {
          const values = Array.from({ length: count }, (_, index) => weights[name]?.[asset.getMorphTargetNameAt(entity, index)] ?? 0);
          renderableManager.setMorphWeights(entity, values, 0);
        }
        if (name === 'Eye_L' || name === 'Eye_R') transformManager.setEntityScale(entity, scales[name], false);
        for (let index = 0; index < renderableManager.getPrimitiveCount(entity); index += 1) {
          const material = renderableManager.getMaterialInstanceAt(entity, index);
          if (name !== 'NeutralMesh' || material.name !== 'MAT_Body_WarmPorcelain') continue;
          material.setFloat4Parameter('baseColorFactor', color);
          material.setFloatParameter('roughnessFactor', roughness);
        }
      }
    }).then(() => { if (active) onReady(); }, () => { if (active) onFailure(); });
    return () => { active = false; };
  }, [asset, weights, scales, color, roughness, renderableManager, nameComponentManager, transformManager, workletContext, onReady, onFailure]);
  return null;
}

function SceneContents(props: Props & { onReady: () => void; onFailure: () => void }) {
  const model = useModel(neutralModel, { shouldReleaseSourceData: false });
  return <FilamentView style={styles.canvas}><Camera cameraPosition={[0, 1, 4]} cameraTarget={[0, .9, 0]} /><DefaultLight /><ModelRenderer model={model}><ModelEffects {...props} model={model} /></ModelRenderer></FilamentView>;
}

export function FilamentMalang(props: Props) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  const onFailure = useCallback(() => setFailed(true), []);
  useEffect(() => {
    if (ready || failed) return;
    const timer = setTimeout(onFailure, 15000);
    return () => clearTimeout(timer);
  }, [ready, failed, onFailure]);
  if (failed) return <StaticMalang {...props} />;
  return <View style={styles.canvas}><FilamentScene fallback={<StaticMalang {...props} />}><SceneContents {...props} onReady={onReady} onFailure={onFailure} /></FilamentScene>{!ready ? <View pointerEvents="none" style={styles.loading}><StaticMalang {...props} /></View> : null}</View>;
}
const styles = StyleSheet.create({ canvas: { flex: 1 }, loading: { ...StyleSheet.absoluteFill } });
