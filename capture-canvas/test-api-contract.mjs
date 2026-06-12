import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import http from "node:http";

const transparentPixel = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";
const mockPort = 9876;
const appPort = 9877;
const received = [];

const mockApi = http.createServer(async (req, res) => {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  const payload = raw ? JSON.parse(raw) : {};
  received.push({ method: req.method, url: req.url, payload });
  res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify({
    imageDataUrl: transparentPixel,
    message: "mock ok",
    message_en: "Mock render returned",
    message_cn: "模拟接口已返回"
  }));
});

await new Promise((resolve) => mockApi.listen(mockPort, "127.0.0.1", resolve));

const root = fileURLToPath(new URL("../", import.meta.url));
const app = spawn(process.execPath, ["serve-static.mjs"], {
  cwd: root,
  env: {
    ...process.env,
    PORT: String(appPort),
    DCC_CUSTOM_API_URL: `http://127.0.0.1:${mockPort}/render`,
    DCC_CUSTOM_API_METHOD: "POST"
  },
  stdio: "ignore"
});

try {
  await waitForJson(`http://127.0.0.1:${appPort}/api/status`);

  const status = await getJson(`http://127.0.0.1:${appPort}/api/status`);
  assert.equal(status.ok, true);
  assert.equal(status.provider, "custom-http");
  assert.equal(status.custom_api_configured, true);

  const test = await postJson(`http://127.0.0.1:${appPort}/api/test-provider`, { provider: "custom-http" });
  assert.equal(test.ok, true);
  assert.equal(test.provider, "custom-http");

  const openAiMissing = await postJson(`http://127.0.0.1:${appPort}/api/test-provider`, { provider: "openai" });
  assert.equal(openAiMissing.ok, false);
  assert.equal(openAiMissing.provider, "openai-missing");

  const render = await postJson(`http://127.0.0.1:${appPort}/api/realtime-render`, {
    schema_version: "0.2.0",
    session_id: "dcc_contract_test",
    provider: "custom-http",
    task: "regional_scene_generation",
    prompt: "test",
    strength: 0.5,
    assets: [],
    mask: { type: "vector_strokes", strokes: [] },
    output: { target: "preview", mode: "realtime_draft", type: "image" },
    sourceImageDataUrl: transparentPixel,
    maskDataUrl: transparentPixel,
    reason: "contract-test"
  });
  assert.equal(render.ok, true);
  assert.equal(render.provider, "custom-http");
  assert.equal(render.imageDataUrl, transparentPixel);

  assert.ok(received.some((item) => item.payload.dcc_capture_bridge?.contract === "custom-http-json-v1"));
  assert.ok(received.some((item) => item.payload.dcc_capture_bridge?.test === true));

  console.log(JSON.stringify({
    api_contract_ok: true,
    mock_requests: received.length,
    app_port: appPort,
    mock_port: mockPort
  }));
} finally {
  app.kill();
  await new Promise((resolve) => mockApi.close(resolve));
}

async function waitForJson(url) {
  const deadline = Date.now() + 5000;
  let lastError;
  while (Date.now() < deadline) {
    try {
      return await getJson(url);
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
  }
  throw lastError || new Error(`Timed out waiting for ${url}`);
}

async function getJson(url) {
  const response = await fetch(url);
  assert.equal(response.ok, true);
  return response.json();
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  assert.equal(response.ok, true);
  return response.json();
}
