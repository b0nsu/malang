import type { FaceParametersV1 } from '@/domain/face';

type MorphWeights = Record<string, number>;
type Eye = FaceParametersV1['eyes']['left'];
type Brow = FaceParametersV1['brows']['left'];

const paired = (value: number) => [Math.max(0, value), Math.max(0, -value)] as const;

function eyeWeights(eye: Eye): MorphWeights {
  const [tiltUp, tiltDown] = paired(eye.tilt);
  return {
    Eye_Close: 1 - eye.openness,
    Eye_Tilt_Up: tiltUp,
    Eye_Tilt_Down: tiltDown,
  };
}

function browWeights(brow: Brow): MorphWeights {
  const [raise, lower] = paired(brow.centerY);
  const [tiltOut, tiltIn] = paired(brow.outerY);
  return {
    Brow_Raise: raise,
    Brow_Lower: lower,
    Brow_Tilt_In: tiltIn,
    Brow_Tilt_Out: tiltOut,
  };
}

function mouthWeights(face: FaceParametersV1): MorphWeights {
  const corners = (face.mouth.leftCornerY + face.mouth.rightCornerY) / 2;
  const [cornersUp, cornersDown] = paired(corners);
  return {
    Mouth_Corners_Up: cornersUp,
    Mouth_Corners_Down: cornersDown,
    Mouth_Open: face.mouth.openness,
    Mouth_Asym_L: Math.max(0, face.mouth.leftCornerY - face.mouth.rightCornerY),
    Mouth_Asym_R: Math.max(0, face.mouth.rightCornerY - face.mouth.leftCornerY),
  };
}

function faceWeights(face: FaceParametersV1): MorphWeights {
  return {
    Face_Wide: face.face.width,
    Face_Long: face.face.length,
    Face_Squash: face.face.volume,
  };
}

/** Maps a face snapshot to the morph targets on one concrete GLB renderable entity. */
export function morphWeightsForEntity(entityName: string, face: FaceParametersV1): MorphWeights {
  switch (entityName) {
    case 'NeutralMesh':
      return faceWeights(face);
    case 'Eye_L':
      return eyeWeights(face.eyes.left);
    case 'Eye_R':
      return eyeWeights(face.eyes.right);
    case 'Brow_L':
      return browWeights(face.brows.left);
    case 'Brow_R':
      return browWeights(face.brows.right);
    case 'Mouth':
      return mouthWeights(face);
    default:
      return {};
  }
}

/**
 * Compatibility aggregate for tests and callers that do not have an entity name.
 * Rendering should prefer morphWeightsForEntity so left/right controls remain independent.
 */
export const morphWeights = (face: FaceParametersV1): MorphWeights => {
  const averageEye: Eye = {
    openness: (face.eyes.left.openness + face.eyes.right.openness) / 2,
    tilt: (face.eyes.left.tilt + face.eyes.right.tilt) / 2,
    scaleX: (face.eyes.left.scaleX + face.eyes.right.scaleX) / 2,
    scaleY: (face.eyes.left.scaleY + face.eyes.right.scaleY) / 2,
  };
  const averageBrow: Brow = {
    centerY: (face.brows.left.centerY + face.brows.right.centerY) / 2,
    outerY: (face.brows.left.outerY + face.brows.right.outerY) / 2,
  };
  return {
    ...faceWeights(face),
    ...eyeWeights(averageEye),
    ...browWeights(averageBrow),
    ...mouthWeights(face),
  };
};

export const morphWeightArray = (targetNames: string[], face: FaceParametersV1, entityName?: string) => {
  const weights = entityName ? morphWeightsForEntity(entityName, face) : morphWeights(face);
  return targetNames.map((name) => weights[name] ?? 0);
};
