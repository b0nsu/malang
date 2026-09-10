/*
 * Keeps the existing MALANG facial rig and morph targets intact while tuning
 * its neutral presentation to the warm, soft mascot style in the product art.
 * Run with: node scripts/polish-malang-model.js
 */
const fs = require('fs');
const path = require('path');

const modelPaths = [
  'assets/models/malang-neutral-v1.glb',
  'dist/assets/assets/models/malang-neutral-v1.3c4999e0fab88248689fc5b285f4d6b7.glb',
].map((file) => path.resolve(__dirname, '..', file));

function readGlb(file) {
  const data = fs.readFileSync(file);
  if (data.readUInt32LE(0) !== 0x46546c67 || data.readUInt32LE(4) !== 2) {
    throw new Error(`${file} is not a glTF 2.0 binary file.`);
  }
  const jsonLength = data.readUInt32LE(12);
  const jsonType = data.readUInt32LE(16);
  if (jsonType !== 0x4e4f534a) throw new Error(`${file} has no JSON chunk.`);
  const json = JSON.parse(data.subarray(20, 20 + jsonLength).toString('utf8').trim());
  const binOffset = 20 + jsonLength;
  const binLength = data.readUInt32LE(binOffset);
  const binType = data.readUInt32LE(binOffset + 4);
  if (binType !== 0x004e4942) throw new Error(`${file} has no binary chunk.`);
  return { json, bin: data.subarray(binOffset + 8, binOffset + 8 + binLength) };
}

function writeGlb(file, json, bin) {
  const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
  const jsonPadding = (4 - (jsonBuffer.length % 4)) % 4;
  const paddedJson = Buffer.concat([jsonBuffer, Buffer.alloc(jsonPadding, 0x20)]);
  const binPadding = (4 - (bin.length % 4)) % 4;
  const paddedBin = Buffer.concat([bin, Buffer.alloc(binPadding)]);
  const output = Buffer.alloc(12 + 8 + paddedJson.length + 8 + paddedBin.length);
  output.writeUInt32LE(0x46546c67, 0);
  output.writeUInt32LE(2, 4);
  output.writeUInt32LE(output.length, 8);
  output.writeUInt32LE(paddedJson.length, 12);
  output.writeUInt32LE(0x4e4f534a, 16);
  paddedJson.copy(output, 20);
  const binHeader = 20 + paddedJson.length;
  output.writeUInt32LE(paddedBin.length, binHeader);
  output.writeUInt32LE(0x004e4942, binHeader + 4);
  paddedBin.copy(output, binHeader + 8);
  fs.writeFileSync(file, output);
}

function polish(file) {
  const { json, bin } = readGlb(file);
  const byName = Object.fromEntries(json.nodes.map((node) => [node.name, node]));

  // A gentle, squat silhouette like the reference mascot. Applying it at the
  // node level preserves every vertex delta in the existing expression rig.
  byName.NeutralMesh.scale = [0.96, 0.9, 1.02];
  byName.Anchor_Eye_L.translation = [-0.285, 1.005, 0.748];
  byName.Anchor_Eye_R.translation = [0.285, 1.005, 0.748];
  byName.Anchor_Mouth.translation = [0, 0.72, 0.8];
  byName.Anchor_Blush_L.translation = [-0.455, 0.79, 0.735];
  byName.Anchor_Blush_R.translation = [0.455, 0.79, 0.735];
  byName.Eye_L.scale = [1.06, 0.86, 1.06];
  byName.Eye_R.scale = [1.06, 0.86, 1.06];
  byName.Mouth.scale = [0.88, 0.9, 1];
  byName.Blush_L.scale = [1.08, 0.86, 1];
  byName.Blush_R.scale = [1.08, 0.86, 1];
  // The reference's resting face is brow-free and has only a suggestion of a smile.
  byName.Brow_L.scale = [0.001, 0.001, 0.001];
  byName.Brow_R.scale = [0.001, 0.001, 0.001];
  json.meshes[0].weights = [0, 0, 0.28];
  json.meshes[3].weights = [0.55, 0, 0, 0, 0];

  const [body, eye, mouth, brow, blush] = json.materials;
  body.name = 'MAT_Body_WarmPorcelain';
  body.pbrMetallicRoughness.baseColorFactor = [1.0, 0.963, 0.922, 1];
  body.pbrMetallicRoughness.roughnessFactor = 0.57;
  eye.name = 'MAT_Eye_GlossyInk';
  eye.pbrMetallicRoughness.baseColorFactor = [0.025, 0.02, 0.024, 1];
  eye.pbrMetallicRoughness.roughnessFactor = 0.18;
  mouth.name = 'MAT_Mouth_SoftInk';
  mouth.pbrMetallicRoughness.baseColorFactor = [0.06, 0.042, 0.045, 1];
  mouth.pbrMetallicRoughness.roughnessFactor = 0.34;
  brow.name = 'MAT_Brow_SoftInk';
  brow.pbrMetallicRoughness.baseColorFactor = [0.06, 0.042, 0.045, 1];
  brow.pbrMetallicRoughness.roughnessFactor = 0.42;
  blush.name = 'MAT_Blush_TranslucentPeach';
  blush.pbrMetallicRoughness.baseColorFactor = [1.0, 0.47, 0.39, 0.38];
  blush.pbrMetallicRoughness.roughnessFactor = 0.74;

  json.asset.generator = 'OpenAI MALANG reference-rig generator · warm mascot polish';
  json.asset.extras = {
    ...(json.asset.extras || {}),
    artDirection: 'Warm porcelain body, glossy ink features, and translucent peach cheeks.',
  };
  json.extras = {
    ...(json.extras || {}),
    presentation: 'Neutral warm mascot polish; facial-rig topology and morph target contracts unchanged.',
  };
  writeGlb(file, json, bin);
}

modelPaths.forEach(polish);
console.log(`Polished ${modelPaths.length} MALANG GLB files.`);
