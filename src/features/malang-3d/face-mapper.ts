import type { FaceParametersV1 } from '@/domain/face';
/** Maps FaceParametersV1 to the morph target names embedded in malang-neutral-v1.glb. */
export const morphWeights = (face: FaceParametersV1) => {
  const browY = (face.brows.left.centerY + face.brows.right.centerY) / 2;
  const browOut = (face.brows.left.outerY + face.brows.right.outerY) / 2;
  const eyeOpen = (face.eyes.left.openness + face.eyes.right.openness) / 2;
  const eyeTilt = (face.eyes.left.tilt + face.eyes.right.tilt) / 2;
  const mouthCorners = (face.mouth.leftCornerY + face.mouth.rightCornerY) / 2;
  return {
    Face_Wide: Math.max(0, face.face.width), Face_Long: Math.max(0, face.face.length), Face_Squash: Math.max(0, face.face.volume),
    Eye_Close: 1 - eyeOpen, Eye_Tilt_Up: Math.max(0, eyeTilt), Eye_Tilt_Down: Math.max(0, -eyeTilt),
    Brow_Raise: Math.max(0, browY), Brow_Lower: Math.max(0, -browY), Brow_Tilt_In: Math.max(0, -browOut), Brow_Tilt_Out: Math.max(0, browOut),
    Mouth_Corners_Up: Math.max(0, mouthCorners), Mouth_Corners_Down: Math.max(0, -mouthCorners), Mouth_Open: face.mouth.openness,
    Mouth_Asym_L: Math.max(0, face.mouth.leftCornerY - face.mouth.rightCornerY), Mouth_Asym_R: Math.max(0, face.mouth.rightCornerY - face.mouth.leftCornerY),
  };
};
export const morphWeightArray = (targetNames: string[], face: FaceParametersV1) => { const weights = morphWeights(face) as Record<string, number>; return targetNames.map(name => weights[name] ?? 0); };
