import { neutralFace, type FaceParametersV1 } from '@/domain/face';
import { eyeScale, isBodyMaterial, morphWeightArray, morphWeights } from './face-mapper';
const faceWith = (partial: Partial<FaceParametersV1>): FaceParametersV1 => ({ ...neutralFace, ...partial });
describe('GLB morph mapper', () => {
  it('maps the neutral face to all entity groups', () => {
    expect(morphWeights(neutralFace, 'NeutralMesh')).toEqual({ Face_Wide: 0, Face_Long: 0, Face_Squash: 0 });
    expect(morphWeights(neutralFace, 'Eye_L')).toEqual({ Eye_Close: 0, Eye_Tilt_Up: 0, Eye_Tilt_Down: 0 });
    expect(morphWeights(neutralFace, 'Mouth')).toEqual({ Mouth_Corners_Up: 0, Mouth_Corners_Down: 0, Mouth_Open: 0, Mouth_Asym_L: 0, Mouth_Asym_R: 0 });
  });
  it('keeps GLB target order and zeroes unknown target names', () => { expect(morphWeightArray(['Mouth_Open', 'unknown', 'Eye_Close'], neutralFace, 'Mouth')).toEqual([0, 0, 0]); });
  it('maps positive and negative directions to separate one-way targets', () => {
    const face = faceWith({ mouth: { ...neutralFace.mouth, leftCornerY: -.5, rightCornerY: -.5 } });
    expect(morphWeights(face, 'Mouth')).toMatchObject({ Mouth_Corners_Down: .5, Mouth_Corners_Up: 0 });
  });
  it('drives each eye independently from per-side openness and tilt', () => {
    const face = faceWith({ eyes: { left: { ...neutralFace.eyes.left, openness: .3, tilt: .4 }, right: { ...neutralFace.eyes.right, openness: .9, tilt: -.6 } } });
    expect(morphWeights(face, 'Eye_L')).toEqual({ Eye_Close: .7, Eye_Tilt_Up: .4, Eye_Tilt_Down: 0 });
    expect(morphWeights(face, 'Eye_R').Eye_Close).toBeCloseTo(.1);
    expect(morphWeights(face, 'Eye_R')).toMatchObject({ Eye_Tilt_Up: 0, Eye_Tilt_Down: .6 });
  });
  it('drives each brow independently, mirroring outer tilt per side', () => {
    const face = faceWith({ brows: { left: { centerY: .5, outerY: .3 }, right: { centerY: -.4, outerY: -.2 } } });
    expect(morphWeights(face, 'Brow_L')).toEqual({ Brow_Raise: .5, Brow_Lower: 0, Brow_Tilt_In: .3, Brow_Tilt_Out: 0 });
    expect(morphWeights(face, 'Brow_R')).toEqual({ Brow_Raise: 0, Brow_Lower: .4, Brow_Tilt_In: .2, Brow_Tilt_Out: 0 });
  });
  it('scales each eye independently with finite fallbacks', () => {
    const face = faceWith({ eyes: { left: { ...neutralFace.eyes.left, scaleX: 1.5, scaleY: .8 }, right: { ...neutralFace.eyes.right, scaleX: NaN } } });
    expect(eyeScale(face, 'left')[0]).toBeCloseTo(1.59);
    expect(eyeScale(face, 'left')[1]).toBeCloseTo(.688);
    expect(eyeScale(face, 'left')[2]).toBe(1.06);
    expect(eyeScale(face, 'right')).toEqual([1.06, .86, 1.06]);
  });
  it('keeps appearance colors on the body slot only', () => {
    expect(isBodyMaterial('MAT_Body_WarmPorcelain')).toBe(true);
    expect(isBodyMaterial('MAT_Eye_GlossyInk')).toBe(false);
    expect(isBodyMaterial('MAT_Mouth_SoftInk')).toBe(false);
    expect(isBodyMaterial('MAT_Brow_SoftInk')).toBe(false);
    expect(isBodyMaterial('MAT_Blush_TranslucentPeach')).toBe(false);
  });
});
