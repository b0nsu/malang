import { clampFace, type FaceParametersV1 } from '@/domain/face';

export const morphWeights = (input: FaceParametersV1, entityName = 'NeutralMesh'): Record<string, number> => {
  const face = clampFace(input);
  const side = entityName.endsWith('_R') ? 'right' : 'left';
  const eye = face.eyes[side];
  const brow = face.brows[side];
  const corners = Math.min(face.mouth.leftCornerY, face.mouth.rightCornerY);
  const browTilt = side === 'left' ? -brow.outerY : brow.outerY;
  const weights: Record<string, number> = entityName.startsWith('Eye_') ? {
    Eye_Close: 1 - eye.openness,
    Eye_Tilt_Up: Math.max(0, eye.tilt),
    Eye_Tilt_Down: Math.max(0, -eye.tilt),
  } : entityName.startsWith('Brow_') ? {
    Brow_Raise: Math.max(0, brow.centerY),
    Brow_Lower: Math.max(0, -brow.centerY),
    Brow_Tilt_In: Math.max(0, -browTilt),
    Brow_Tilt_Out: Math.max(0, browTilt),
  } : entityName === 'Mouth' ? {
    Mouth_Corners_Up: Math.max(0, corners),
    Mouth_Corners_Down: Math.max(0, -corners),
    Mouth_Open: face.mouth.openness,
    Mouth_Asym_L: Math.max(0, (face.mouth.leftCornerY - face.mouth.rightCornerY) * (7 / 6.5)),
    Mouth_Asym_R: Math.max(0, (face.mouth.rightCornerY - face.mouth.leftCornerY) * (7 / 6.5)),
  } : entityName === 'NeutralMesh' ? {
    Face_Wide: Math.max(0, face.face.width),
    Face_Long: Math.max(0, face.face.length),
    Face_Squash: Math.max(0, face.face.volume),
  } : {};
  return Object.fromEntries(Object.entries(weights).map(([name, value]) => [name, Number.isFinite(value) ? value : 0]));
};

export const morphWeightArray = (targetNames: string[], face: FaceParametersV1, entityName = 'NeutralMesh') => {
  const weights = morphWeights(face, entityName);
  return targetNames.map(name => weights[name] ?? 0);
};

export const eyeScale = (face: FaceParametersV1, side: 'left' | 'right'): [number, number, number] => {
  const eye = clampFace(face).eyes[side];
  return [1.06 * (Number.isFinite(eye.scaleX) ? eye.scaleX : 1), .86 * (Number.isFinite(eye.scaleY) ? eye.scaleY : 1), 1.06];
};

export const isBodyMaterial = (name: string) => name === 'MAT_Body_WarmPorcelain';

export const bodyColor = (hex: string): [number, number, number, number] => {
  const normalized = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex.slice(1) : 'B7D7CF';
  const linear = (offset: number) => {
    const value = Number.parseInt(normalized.slice(offset, offset + 2), 16) / 255;
    return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
  };
  return [linear(0), linear(2), linear(4), 1];
};
