import assert from "node:assert/strict";
import { buildGenerationRequest, chooseProvider, createSessionState, registerAsset } from "./capture-core.mjs";

let state = createSessionState(new Date("2026-06-08T06:00:00.000Z"));

state = registerAsset(state, {
  kind: "image",
  name: "product-front.png",
  size: 512000,
  mime: "image/png",
  width: 1024,
  height: 768,
});

const strokes = [
  {
    mode: "brush",
    size: 42,
    points: [
      { x: 220.1234, y: 160.5678 },
      { x: 260, y: 190 },
      { x: 310, y: 230 },
    ],
  },
  {
    mode: "erase",
    size: 24,
    points: [
      { x: 245, y: 175 },
      { x: 252, y: 181 },
    ],
  },
];

const request = buildGenerationRequest({
  state,
  prompt: "place the product in a clean stone studio scene",
  strokes,
  strength: 68,
  provider: chooseProvider("comfyui").id,
});

assert.equal(request.schema_version, "0.2.0");
assert.equal(request.provider, "comfyui-local");
assert.equal(request.assets.length, 1);
assert.equal(request.assets[0].kind, "image");
assert.equal(request.mask.strokes.length, 2);
assert.equal(request.mask.strokes[0].points[0].x, 220.12);
assert.equal(request.strength, 0.68);
assert.equal(chooseProvider("api").transport, "https");
assert.equal(chooseProvider("mock").transport, "none");

console.log(JSON.stringify({
  simulation_ok: true,
  provider: request.provider,
  assets: request.assets.length,
  strokes: request.mask.strokes.length,
  strength: request.strength,
}));
