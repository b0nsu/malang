const { readFileSync } = require('node:fs') as { readFileSync: (path: string) => { readUInt32LE: (offset: number) => number; readFloatLE: (offset: number) => number; subarray: (start: number, end?: number) => { toString: () => string } & { readFloatLE: (offset: number) => number }; length: number } };
const { resolve } = require('node:path') as { resolve: (...segments: string[]) => string };
import { neutralFace } from '@/domain/face';
import { isBodyMaterial, morphWeightArray, morphWeights } from './face-mapper';

const bytes = readFileSync(resolve(process.cwd(), 'assets/models/malang-neutral-v1.glb'));

const jsonLength = bytes.readUInt32LE(12);
const rig = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString());
const binary = bytes.subarray(28 + jsonLength);
const node = (name: string) => rig.nodes.find((value: { name: string }) => value.name === name);
const mesh = (name: string) => rig.meshes[node(name).mesh];
const values = (index: number): number[][] => {
  const accessor = rig.accessors[index];
  const view = rig.bufferViews[accessor.bufferView];
  expect(accessor.componentType).toBe(5126);
  const offset = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  return Array.from({ length: accessor.count }, (_, i) => [0, 1, 2].map(axis => binary.readFloatLE(offset + i * (view.byteStride ?? 12) + axis * 4)));
};

it('the shipped GLB contains every mapped morph with matching target counts and neutral weights', () => {
  expect(bytes.readUInt32LE(0)).toBe(0x46546c67);
  expect(bytes.readUInt32LE(8)).toBe(bytes.length);
  for (const name of ['NeutralMesh', 'Eye_L', 'Eye_R', 'Brow_L', 'Brow_R', 'Mouth']) {
    const current = mesh(name);
    expect(current.extras.targetNames).toEqual(Object.keys(morphWeights(neutralFace, name)));
    expect(current.primitives[0].targets).toHaveLength(current.extras.targetNames.length);
    expect(current.weights).toEqual(morphWeightArray(current.extras.targetNames, neutralFace, name));
    for (const target of current.primitives[0].targets) {
      const deltas = values(target.POSITION).flat();
      expect(deltas.every(Number.isFinite)).toBe(true);
      expect(deltas.some(value => value !== 0)).toBe(true);
    }
  }
});

it('supports independent eye and brow entities sharing real mesh targets, with brows visible', () => {
  for (const feature of ['Eye', 'Brow']) {
    expect(node(`${feature}_L`)).not.toBe(node(`${feature}_R`));
    expect(node(`${feature}_L`).mesh).toBe(node(`${feature}_R`).mesh);
    expect(node(`Anchor_${feature}_L`).translation[0]).toBeLessThan(0);
    expect(node(`Anchor_${feature}_R`).translation[0]).toBeGreaterThan(0);
  }
  expect(node('Brow_L').scale).toEqual([1, 1, 1]);
  expect(node('Brow_R').scale).toEqual([1, 1, 1]);
});

it('keeps body material separate from every facial feature', () => {
  const body = mesh('NeutralMesh').primitives[0].material;
  expect(isBodyMaterial(rig.materials[body].name)).toBe(true);
  for (const name of ['Eye_L', 'Eye_R', 'Brow_L', 'Brow_R', 'Mouth', 'Blush_L', 'Blush_R']) {
    const material = mesh(name).primitives[0].material;
    expect(material).not.toBe(body);
    expect(isBodyMaterial(rig.materials[material].name)).toBe(false);
  }
});

it('moves the actual outer brow vertices upward on either side without cross-driving', () => {
  for (const side of ['left', 'right'] as const) {
    const name = side === 'left' ? 'Brow_L' : 'Brow_R';
    const current = mesh(name);
    const primitive = current.primitives[0];
    const positions = values(primitive.attributes.POSITION);
    const outer = positions.reduce((best, point, i) => (side === 'left' ? point[0] < positions[best][0] : point[0] > positions[best][0]) ? i : best, 0);
    const face = { ...neutralFace, brows: { ...neutralFace.brows, [side]: { centerY: 0, outerY: 1 } } };
    const weights = morphWeightArray(current.extras.targetNames, face, name);
    const deltaY = primitive.targets.reduce((sum: number, target: { POSITION: number }, i: number) => sum + values(target.POSITION)[outer][1] * weights[i], 0);
    expect(deltaY).toBeGreaterThan(0);
    expect(Object.values(morphWeights(face, side === 'left' ? 'Brow_R' : 'Brow_L'))).toEqual([0, 0, 0, 0]);
  }
});
