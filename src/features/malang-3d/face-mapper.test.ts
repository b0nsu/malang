import { neutralFace } from '@/domain/face';
import { morphWeightArray, morphWeights, morphWeightsForEntity } from './face-mapper';

describe('GLB morph mapper', () => {
  it('uses the target names exported by the production GLB', () => {
    expect(morphWeights(neutralFace)).toMatchObject({ Eye_Close: 0, Mouth_Open: 0, Face_Wide: 0 });
  });

  it('keeps GLB target order and zeroes unknown target names', () => {
    expect(morphWeightArray(['Mouth_Open', 'unknown', 'Eye_Close'], neutralFace)).toEqual([0, 0, 0]);
  });

  it('maps positive and negative directions to separate one-way targets', () => {
    const face = {
      ...neutralFace,
      face: { ...neutralFace.face, width: .6 },
      mouth: { ...neutralFace.mouth, leftCornerY: -.5, rightCornerY: -.5 },
    };
    expect(morphWeights(face)).toMatchObject({ Face_Wide: .6, Mouth_Corners_Down: .5, Mouth_Corners_Up: 0 });
  });

  it('keeps left and right eye controls independent', () => {
    const face = {
      ...neutralFace,
      eyes: {
        left: { ...neutralFace.eyes.left, openness: .2, tilt: .5 },
        right: { ...neutralFace.eyes.right, openness: .8, tilt: -.4 },
      },
    };
    expect(morphWeightsForEntity('Eye_L', face)).toMatchObject({ Eye_Close: .8, Eye_Tilt_Up: .5, Eye_Tilt_Down: 0 });
    expect(morphWeightsForEntity('Eye_R', face)).toMatchObject({ Eye_Close: .2, Eye_Tilt_Up: 0, Eye_Tilt_Down: .4 });
  });

  it('keeps left and right brow controls independent', () => {
    const face = {
      ...neutralFace,
      brows: {
        left: { centerY: .7, outerY: -.3 },
        right: { centerY: -.6, outerY: .4 },
      },
    };
    expect(morphWeightsForEntity('Brow_L', face)).toMatchObject({ Brow_Raise: .7, Brow_Lower: 0, Brow_Tilt_In: .3, Brow_Tilt_Out: 0 });
    expect(morphWeightsForEntity('Brow_R', face)).toMatchObject({ Brow_Raise: 0, Brow_Lower: .6, Brow_Tilt_In: 0, Brow_Tilt_Out: .4 });
  });

  it('uses signed weights for face geometry that has no paired inverse target', () => {
    const face = { ...neutralFace, face: { ...neutralFace.face, width: -.5, length: .25, volume: -.2 } };
    expect(morphWeightsForEntity('NeutralMesh', face)).toMatchObject({ Face_Wide: -.5, Face_Long: .25, Face_Squash: -.2 });
  });
});
