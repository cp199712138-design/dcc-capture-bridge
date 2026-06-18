import assert from "node:assert/strict";
import { parseModelFile } from "./model-viewer.mjs";

function fileFromBytes(name, bytes, type = "application/octet-stream") {
  return new File([bytes], name, { type });
}

function align4(length) {
  return (length + 3) & ~3;
}

function paddedBytes(bytes, pad = 0x20) {
  const output = new Uint8Array(align4(bytes.length));
  output.fill(pad);
  output.set(bytes);
  return output;
}

function createTinyGlb() {
  const positions = new Float32Array([
    0, 0, 0,
    1, 0, 0,
    0, 1, 0,
  ]);
  const indices = new Uint16Array([0, 1, 2]);
  const positionBytes = new Uint8Array(positions.buffer);
  const indexBytes = new Uint8Array(indices.buffer);
  const binLength = align4(positionBytes.length) + align4(indexBytes.length);
  const json = {
    asset: { version: "2.0" },
    buffers: [{ byteLength: binLength }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: positionBytes.length },
      { buffer: 0, byteOffset: align4(positionBytes.length), byteLength: indexBytes.length },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 3, type: "VEC3" },
      { bufferView: 1, componentType: 5123, count: 3, type: "SCALAR" },
    ],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1 }] }],
  };

  const jsonBytes = paddedBytes(new TextEncoder().encode(JSON.stringify(json)), 0x20);
  const binBytes = new Uint8Array(binLength);
  binBytes.set(positionBytes, 0);
  binBytes.set(indexBytes, align4(positionBytes.length));

  const totalLength = 12 + 8 + jsonBytes.length + 8 + binBytes.length;
  const buffer = new ArrayBuffer(totalLength);
  const view = new DataView(buffer);
  const out = new Uint8Array(buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, totalLength, true);
  view.setUint32(12, jsonBytes.length, true);
  view.setUint32(16, 0x4e4f534a, true);
  out.set(jsonBytes, 20);
  const binHeader = 20 + jsonBytes.length;
  view.setUint32(binHeader, binBytes.length, true);
  view.setUint32(binHeader + 4, 0x004e4942, true);
  out.set(binBytes, binHeader + 8);
  return new Uint8Array(buffer);
}

const obj = await parseModelFile(new File(["v 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3\n"], "tiny.obj"));
assert.equal(obj.format, "obj");
assert.equal(obj.triangleCount, 1);

const glb = await parseModelFile(fileFromBytes("tiny.glb", createTinyGlb(), "model/gltf-binary"));
assert.equal(glb.format, "glb");
assert.equal(glb.triangleCount, 1);

console.log(JSON.stringify({ model_import_ok: true, formats: ["obj", "glb"] }));
