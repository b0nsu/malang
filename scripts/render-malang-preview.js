/* Lightweight, dependency-free GLB front-view renderer for visual QA. */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const input = path.resolve(__dirname, '..', 'assets/models/malang-neutral-v1.glb');
const output = path.resolve(__dirname, '..', 'reference/malang-polished-preview.png');
const scale = 2;
const width = 720 * scale;
const height = 720 * scale;

function glb(file) {
  const bytes = fs.readFileSync(file);
  const jsonLength = bytes.readUInt32LE(12);
  const json = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString().trim());
  const binOffset = 20 + jsonLength;
  return { json, bin: bytes.subarray(binOffset + 8, binOffset + 8 + bytes.readUInt32LE(binOffset)) };
}

function pngRgba(rgba, imageWidth, imageHeight) {
  const raw = Buffer.alloc((imageWidth * 4 + 1) * imageHeight);
  for (let y = 0; y < imageHeight; y += 1) {
    raw[y * (imageWidth * 4 + 1)] = 0;
    rgba.copy(raw, y * (imageWidth * 4 + 1) + 1, y * imageWidth * 4, (y + 1) * imageWidth * 4);
  }
  const chunk = (type, data) => {
    const head = Buffer.alloc(4);
    head.writeUInt32BE(data.length, 0);
    const crc = Buffer.alloc(4);
    let value = 0xffffffff;
    const all = Buffer.concat([Buffer.from(type), data]);
    for (const byte of all) {
      value ^= byte;
      for (let bit = 0; bit < 8; bit += 1) value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
    }
    crc.writeUInt32BE((value ^ 0xffffffff) >>> 0);
    return Buffer.concat([head, Buffer.from(type), data, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(imageWidth, 0); ihdr.writeUInt32BE(imageHeight, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const { json, bin } = glb(input);
const bg = [250, 246, 239, 255];
const pixels = Buffer.alloc(width * height * 4);
const depth = new Float32Array(width * height).fill(-Infinity);
for (let i = 0; i < width * height; i += 1) pixels.set(bg, i * 4);

function accessor(index) {
  const a = json.accessors[index]; const view = json.bufferViews[a.bufferView];
  const size = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[a.type];
  const bytes = { 5123: 2, 5125: 4, 5126: 4 }[a.componentType];
  const offset = (view.byteOffset || 0) + (a.byteOffset || 0);
  const stride = view.byteStride || size * bytes;
  const getter = a.componentType === 5126 ? (at) => bin.readFloatLE(at) : a.componentType === 5125 ? (at) => bin.readUInt32LE(at) : (at) => bin.readUInt16LE(at);
  return Array.from({ length: a.count }, (_, i) => Array.from({ length: size }, (_, c) => getter(offset + i * stride + c * bytes)));
}
function rgba(material) {
  const [r, g, b, a] = material.pbrMetallicRoughness.baseColorFactor;
  return [r, g, b, a, material.pbrMetallicRoughness.roughnessFactor];
}
function visit(nodeIndex, parent) {
  const node = json.nodes[nodeIndex];
  const translation = node.translation || [0, 0, 0];
  const nodeScale = node.scale || [1, 1, 1];
  const transform = {
    t: [parent.t[0] + translation[0] * parent.s[0], parent.t[1] + translation[1] * parent.s[1], parent.t[2] + translation[2] * parent.s[2]],
    s: [parent.s[0] * nodeScale[0], parent.s[1] * nodeScale[1], parent.s[2] * nodeScale[2]],
  };
  if (node.mesh !== undefined) drawMesh(json.meshes[node.mesh], transform);
  (node.children || []).forEach((child) => visit(child, transform));
}
function drawMesh(mesh, transform) {
  for (const primitive of mesh.primitives) {
    const positions = accessor(primitive.attributes.POSITION);
    const targets = (primitive.targets || []).map((target) => accessor(target.POSITION));
    const weights = mesh.weights || [];
    const normals = accessor(primitive.attributes.NORMAL);
    const indices = accessor(primitive.indices).flat();
    const material = rgba(json.materials[primitive.material]);
    for (let i = 0; i < indices.length; i += 3) {
      const tri = [indices[i], indices[i + 1], indices[i + 2]].map((index) => {
        const p = positions[index].map((value, axis) => value + targets.reduce((sum, target, targetIndex) => sum + target[index][axis] * (weights[targetIndex] || 0), 0)); const n = normals[index];
        const world = [p[0] * transform.s[0] + transform.t[0], p[1] * transform.s[1] + transform.t[1], p[2] * transform.s[2] + transform.t[2]];
        const normal = [n[0] / transform.s[0], n[1] / transform.s[1], n[2] / transform.s[2]];
        const length = Math.hypot(...normal) || 1;
        normal.forEach((_, axis) => { normal[axis] /= length; });
        return { x: width * (0.5 + world[0] / 2.3), y: height * (0.87 - world[1] / 2.05), z: world[2], n: normal };
      });
      const minX = Math.max(0, Math.floor(Math.min(...tri.map((v) => v.x)))); const maxX = Math.min(width - 1, Math.ceil(Math.max(...tri.map((v) => v.x))));
      const minY = Math.max(0, Math.floor(Math.min(...tri.map((v) => v.y)))); const maxY = Math.min(height - 1, Math.ceil(Math.max(...tri.map((v) => v.y))));
      const area = (tri[1].x - tri[0].x) * (tri[2].y - tri[0].y) - (tri[1].y - tri[0].y) * (tri[2].x - tri[0].x);
      if (!area) continue;
      for (let y = minY; y <= maxY; y += 1) for (let x = minX; x <= maxX; x += 1) {
        const fx = x + 0.5; const fy = y + 0.5;
        const w0 = ((tri[1].x - fx) * (tri[2].y - fy) - (tri[1].y - fy) * (tri[2].x - fx)) / area;
        const w1 = ((tri[2].x - fx) * (tri[0].y - fy) - (tri[2].y - fy) * (tri[0].x - fx)) / area;
        const w2 = 1 - w0 - w1;
        if (w0 < 0 || w1 < 0 || w2 < 0) continue;
        const z = w0 * tri[0].z + w1 * tri[1].z + w2 * tri[2].z; const pixel = y * width + x;
        if (z < depth[pixel] - 0.0001) continue;
        const n = [0, 1, 2].map((axis) => w0 * tri[0].n[axis] + w1 * tri[1].n[axis] + w2 * tri[2].n[axis]);
        const light = Math.max(0.22, n[0] * -0.32 + n[1] * 0.44 + n[2] * 0.84);
        const highlight = Math.pow(Math.max(0, n[0] * -0.2 + n[1] * 0.35 + n[2] * 0.92), 18) * (1 - material[4]) * 0.18;
        const src = material.slice(0, 3).map((channel) => Math.round(255 * Math.pow(Math.min(1, channel * (0.34 + light * 0.7) + highlight), 1 / 2.2)));
        const alpha = material[3]; const base = pixel * 4;
        pixels[base] = Math.round(src[0] * alpha + pixels[base] * (1 - alpha));
        pixels[base + 1] = Math.round(src[1] * alpha + pixels[base + 1] * (1 - alpha));
        pixels[base + 2] = Math.round(src[2] * alpha + pixels[base + 2] * (1 - alpha));
        if (alpha >= 0.99) depth[pixel] = z;
      }
    }
  }
}

json.scenes[json.scene || 0].nodes.forEach((node) => visit(node, { t: [0, 0, 0], s: [1, 1, 1] }));
const downsampled = Buffer.alloc((width / scale) * (height / scale) * 4);
for (let y = 0; y < height / scale; y += 1) for (let x = 0; x < width / scale; x += 1) {
  const result = (y * (width / scale) + x) * 4;
  for (let channel = 0; channel < 4; channel += 1) {
    let sum = 0;
    for (let oy = 0; oy < scale; oy += 1) for (let ox = 0; ox < scale; ox += 1) sum += pixels[((y * scale + oy) * width + x * scale + ox) * 4 + channel];
    downsampled[result + channel] = Math.round(sum / (scale * scale));
  }
}
fs.writeFileSync(output, pngRgba(downsampled, width / scale, height / scale));
console.log(output);
