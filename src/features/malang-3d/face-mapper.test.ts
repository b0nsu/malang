import { neutralFace } from '@/domain/face';
import { morphWeightArray, morphWeights } from './face-mapper';
describe('GLB morph mapper', () => {
  it('uses the target names exported by the production GLB', () => { expect(morphWeights(neutralFace)).toMatchObject({ Eye_Close: 0, Mouth_Open: 0, Face_Wide: 0 }); });
  it('keeps GLB target order and zeroes unknown target names', () => { expect(morphWeightArray(['Mouth_Open', 'unknown', 'Eye_Close'], neutralFace)).toEqual([0, 0, 0]); });
  it('maps positive and negative directions to separate one-way targets', () => { const face = { ...neutralFace, face: { ...neutralFace.face, width: .6 }, mouth: { ...neutralFace.mouth, leftCornerY: -.5, rightCornerY: -.5 } }; expect(morphWeights(face)).toMatchObject({ Face_Wide: .6, Mouth_Corners_Down: .5, Mouth_Corners_Up: 0 }); });
});
