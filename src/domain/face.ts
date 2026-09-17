import { z } from 'zod';

const signedControlSchema = z.number().finite().min(-1).max(1);
const unitControlSchema = z.number().finite().min(0).max(1);
const scaleControlSchema = z.number().finite().min(0).max(2);

export const faceParametersSchema = z.object({
  version: z.literal(1),
  brows: z.object({
    left: z.object({ centerY: signedControlSchema, outerY: signedControlSchema }).strict(),
    right: z.object({ centerY: signedControlSchema, outerY: signedControlSchema }).strict(),
  }).strict(),
  eyes: z.object({
    left: z.object({ openness: unitControlSchema, tilt: signedControlSchema, scaleX: scaleControlSchema, scaleY: scaleControlSchema }).strict(),
    right: z.object({ openness: unitControlSchema, tilt: signedControlSchema, scaleX: scaleControlSchema, scaleY: scaleControlSchema }).strict(),
  }).strict(),
  mouth: z.object({ leftCornerY: signedControlSchema, rightCornerY: signedControlSchema, openness: unitControlSchema }).strict(),
  face: z.object({ width: signedControlSchema, length: signedControlSchema, skewX: signedControlSchema, tilt: signedControlSchema, volume: signedControlSchema }).strict(),
}).strict();

export type FaceParametersV1 = z.infer<typeof faceParametersSchema>;

export const neutralFace: FaceParametersV1 = {
  version: 1,
  brows: { left: { centerY: 0, outerY: 0 }, right: { centerY: 0, outerY: 0 } },
  eyes: {
    left: { openness: 1, tilt: 0, scaleX: 1, scaleY: 1 },
    right: { openness: 1, tilt: 0, scaleX: 1, scaleY: 1 },
  },
  mouth: { leftCornerY: 0, rightCornerY: 0, openness: 0 },
  face: { width: 0, length: 0, skewX: 0, tilt: 0, volume: 0 },
};

export const clamp = (value: number, min = -1, max = 1) => Math.min(max, Math.max(min, value));

export function clampFace(face: FaceParametersV1): FaceParametersV1 {
  return {
    ...face,
    brows: {
      left: { centerY: clamp(face.brows.left.centerY), outerY: clamp(face.brows.left.outerY) },
      right: { centerY: clamp(face.brows.right.centerY), outerY: clamp(face.brows.right.outerY) },
    },
    eyes: {
      left: {
        ...face.eyes.left,
        openness: clamp(face.eyes.left.openness, 0, 1),
        tilt: clamp(face.eyes.left.tilt),
        scaleX: clamp(face.eyes.left.scaleX, 0, 2),
        scaleY: clamp(face.eyes.left.scaleY, 0, 2),
      },
      right: {
        ...face.eyes.right,
        openness: clamp(face.eyes.right.openness, 0, 1),
        tilt: clamp(face.eyes.right.tilt),
        scaleX: clamp(face.eyes.right.scaleX, 0, 2),
        scaleY: clamp(face.eyes.right.scaleY, 0, 2),
      },
    },
    mouth: {
      leftCornerY: clamp(face.mouth.leftCornerY),
      rightCornerY: clamp(face.mouth.rightCornerY),
      openness: clamp(face.mouth.openness, 0, 1),
    },
    face: {
      width: clamp(face.face.width),
      length: clamp(face.face.length),
      skewX: clamp(face.face.skewX),
      tilt: clamp(face.face.tilt),
      volume: clamp(face.face.volume),
    },
  };
}

export type FaceAxis = keyof FaceParametersV1['face'];

export function adjustFaceAxis(face: FaceParametersV1, axis: FaceAxis, delta: number) {
  return clampFace({ ...face, face: { ...face.face, [axis]: face.face[axis] + delta } });
}
