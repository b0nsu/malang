import { clampFace, neutralFace } from './face';

describe('face parameters', () => {
  it('clamps editable parameters without changing the schema version', () => {
    const result = clampFace({ ...neutralFace, eyes: { ...neutralFace.eyes, left: { openness: 4, tilt: -4, scaleX: 9, scaleY: -3 } }, face: { ...neutralFace.face, volume: -8 } });
    expect(result.version).toBe(1);
    expect(result.eyes.left).toEqual({ openness: 1, tilt: -1, scaleX: 2, scaleY: 0 });
    expect(result.face.volume).toBe(-1);
  });
});
