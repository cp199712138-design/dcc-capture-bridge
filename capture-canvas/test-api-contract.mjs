import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import http from "node:http";
import { callDirectCustomApi } from "./api-client.mjs";

const transparentPixel = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";
const mockPort = 9876;
const appPort = 9877;
const localAppPort = 9878;
const b64AppPort = 9879;
const missingImageAppPort = 9880;
const openAiHtmlAppPort = 9881;
const customMissingKeyAppPort = 9882;
const received = [];

const mockApi = http.createServer(async (req, res) => {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  const payload = raw && req.headers["content-type"]?.includes("application/json") ? JSON.parse(raw) : {};
  received.push({ method: req.method, url: req.url, payload });

  if (req.url === "/v1/images/edits") {
    res.writeHead(502, { "content-type": "text/html; charset=utf-8" });
    res.end("<!doctype html><title>Bad Gateway</title><h1>upstream unavailable</h1>");
    return;
  }

  res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
  if (req.url === "/b64") {
    res.end(JSON.stringify({
      b64_json: stripDataUrl(transparentPixel),
      message: "mock b64 ok",
      message_en: "Mock b64 render returned"
    }));
    return;
  }
  if (req.url === "/missing-image") {
    res.end(JSON.stringify({
      message: "accepted but no image",
      detail: "render job completed without image payload"
    }));
    return;
  }
  res.end(JSON.stringify({
    imageDataUrl: transparentPixel,
    message: "mock ok",
    message_en: "Mock render returned"
  }));
});

await new Promise((resolve) => mockApi.listen(mockPort, "127.0.0.1", resolve));

const root = fileURLToPath(new URL("../", import.meta.url));
const app = startApp(appPort, {
  DCC_CUSTOM_API_URL: `http://127.0.0.1:${mockPort}/render`,
  DCC_CUSTOM_API_KEY: "test-custom-key",
  DCC_CUSTOM_API_METHOD: "POST"
});
const localApp = startApp(localAppPort);
const b64App = startApp(b64AppPort, {
  DCC_CUSTOM_API_URL: `http://127.0.0.1:${mockPort}/b64`,
  DCC_CUSTOM_API_KEY: "test-custom-key",
  DCC_CUSTOM_API_METHOD: "POST"
});
const missingImageApp = startApp(missingImageAppPort, {
  DCC_CUSTOM_API_URL: `http://127.0.0.1:${mockPort}/missing-image`,
  DCC_CUSTOM_API_KEY: "test-custom-key",
  DCC_CUSTOM_API_METHOD: "POST"
});
const openAiHtmlApp = startApp(openAiHtmlAppPort, {
  OPENAI_API_KEY: "test-key",
  OPENAI_BASE_URL: `http://127.0.0.1:${mockPort}/v1`,
  OPENAI_IMAGE_MODEL: "test-image-model"
});
const customMissingKeyApp = startApp(customMissingKeyAppPort, {
  DCC_CUSTOM_API_URL: `http://127.0.0.1:${mockPort}/render`,
  DCC_CUSTOM_API_METHOD: "POST"
});

try {
  await waitForJson(`http://127.0.0.1:${appPort}/api/status`);
  await waitForJson(`http://127.0.0.1:${localAppPort}/api/status`);
  await waitForJson(`http://127.0.0.1:${b64AppPort}/api/status`);
  await waitForJson(`http://127.0.0.1:${missingImageAppPort}/api/status`);
  await waitForJson(`http://127.0.0.1:${openAiHtmlAppPort}/api/status`);
  await waitForJson(`http://127.0.0.1:${customMissingKeyAppPort}/api/status`);

  const status = await getJson(`http://127.0.0.1:${appPort}/api/status`);
  assert.equal(status.ok, true);
  assert.equal(status.provider, "mock-local");
  assert.equal(status.custom_api_configured, true);
  assert.equal(status.custom_api_host, `127.0.0.1:${mockPort}`);

  const localStatus = await getJson(`http://127.0.0.1:${localAppPort}/api/status`);
  assert.equal(localStatus.ok, true);
  assert.equal(localStatus.provider, "mock-local");
  assert.equal(localStatus.openai_configured, false);
  assert.equal(localStatus.custom_api_configured, false);
  assert.equal(localStatus.has_api_key, false);

  const openAiStatus = await getJson(`http://127.0.0.1:${openAiHtmlAppPort}/api/status`);
  assert.equal(openAiStatus.provider, "mock-local");
  assert.equal(openAiStatus.openai_configured, true);

  const customMissingKeyStatus = await getJson(`http://127.0.0.1:${customMissingKeyAppPort}/api/status`);
  assert.equal(customMissingKeyStatus.ok, true);
  assert.equal(customMissingKeyStatus.provider, "mock-local");
  assert.equal(customMissingKeyStatus.custom_api_configured, false);
  assert.equal(customMissingKeyStatus.custom_api_host, `127.0.0.1:${mockPort}`);

  const autoWithOpenAiKey = await postJson(`http://127.0.0.1:${openAiHtmlAppPort}/api/realtime-render`, {
    ...renderRequest(),
    provider: "auto",
    prompt: "auto should stay local"
  });
  assert.equal(autoWithOpenAiKey.ok, true);
  assert.equal(autoWithOpenAiKey.provider, "mock-local");
  assert.equal(received.filter((item) => item.url === "/v1/images/edits").length, 0);

  const config = await getJson(`http://127.0.0.1:${appPort}/api/config`);
  assert.equal(config.ok, true);
  assert.equal(config.custom.base_url, `http://127.0.0.1:${mockPort}/render`);
  assert.equal(config.custom.method, "POST");
  assert.equal(config.custom.key_saved, true);

  const test = await postJson(`http://127.0.0.1:${appPort}/api/test-provider`, { provider: "custom-http" });
  assert.equal(test.ok, true);
  assert.equal(test.provider, "custom-http");

  const connectionWithoutImage = await postJson(`http://127.0.0.1:${missingImageAppPort}/api/test-provider`, { provider: "custom-http" });
  assert.equal(connectionWithoutImage.ok, true);
  assert.equal(connectionWithoutImage.provider, "custom-http");

  const mockTest = await postJson(`http://127.0.0.1:${appPort}/api/test-provider`, { provider: "mock-local" });
  assert.equal(mockTest.ok, false);
  assert.equal(mockTest.provider, "mock-local");

  const openAiMissing = await postJson(`http://127.0.0.1:${appPort}/api/test-provider`, { provider: "openai" });
  assert.equal(openAiMissing.ok, false);
  assert.equal(openAiMissing.provider, "openai-missing");

  const customMissingUrl = await postJson(`http://127.0.0.1:${localAppPort}/api/test-provider`, { provider: "custom-http" });
  assert.equal(customMissingUrl.ok, false);
  assert.equal(customMissingUrl.provider, "custom-http-missing");
  assert.match(customMissingUrl.message_en, /DCC_CUSTOM_API_URL/i);

  const customMissingKey = await postJson(`http://127.0.0.1:${customMissingKeyAppPort}/api/test-provider`, { provider: "custom-http" });
  assert.equal(customMissingKey.ok, false);
  assert.equal(customMissingKey.provider, "custom-http-missing");
  assert.match(customMissingKey.message_en, /DCC_CUSTOM_API_KEY/i);

  const customMissingKeyRender = await postJson(`http://127.0.0.1:${customMissingKeyAppPort}/api/realtime-render`, renderRequest());
  assert.equal(customMissingKeyRender.ok, false);
  assert.equal(customMissingKeyRender.provider, "custom-http-missing");
  assert.match(customMissingKeyRender.message_en, /DCC_CUSTOM_API_KEY/i);

  const render = await postJson(`http://127.0.0.1:${appPort}/api/realtime-render`, renderRequest());
  assert.equal(render.ok, true);
  assert.equal(render.provider, "custom-http");
  assert.equal(render.imageDataUrl, transparentPixel);

  const b64Render = await postJson(`http://127.0.0.1:${b64AppPort}/api/realtime-render`, renderRequest());
  assert.equal(b64Render.ok, true);
  assert.equal(b64Render.provider, "custom-http");
  assert.equal(b64Render.imageDataUrl, transparentPixel);
  assertValidPngDataUrl(b64Render.imageDataUrl);

  installTestLocalStorage();
  const directB64Render = await callDirectCustomApi(renderRequest(), {
    baseUrl: `http://127.0.0.1:${mockPort}/b64`,
    apiKey: "test-custom-key"
  });
  assert.equal(directB64Render.imageDataUrl, transparentPixel);
  assertValidPngDataUrl(directB64Render.imageDataUrl);

  const missingImageRender = await postJson(`http://127.0.0.1:${missingImageAppPort}/api/realtime-render`, renderRequest());
  assert.equal(missingImageRender.ok, false);
  assert.equal(missingImageRender.provider, "custom-http");
  assert.equal(missingImageRender.imageDataUrl, "");
  assert.match(missingImageRender.message_en, /image/i);

  await assert.rejects(
    () => callDirectCustomApi(renderRequest(), {
      baseUrl: `http://127.0.0.1:${mockPort}/missing-image`,
      apiKey: "test-custom-key"
    }),
    /image/i
  );

  await assert.rejects(
    () => callDirectCustomApi(renderRequest(), {
      baseUrl: `http://127.0.0.1:${mockPort}/render`
    }),
    /key/i
  );

  const htmlOpenAiRender = await postJson(`http://127.0.0.1:${openAiHtmlAppPort}/api/realtime-render`, {
    ...renderRequest(),
    provider: "openai"
  });
  assert.equal(htmlOpenAiRender.ok, false);
  assert.equal(htmlOpenAiRender.provider, "openai");
  assert.equal(htmlOpenAiRender.status, 502);
  assert.match(htmlOpenAiRender.message_en, /502/);
  assert.match(htmlOpenAiRender.message_en, /Bad Gateway|upstream unavailable/);

  const mockRender = await postJson(`http://127.0.0.1:${localAppPort}/api/realtime-render`, {
    ...renderRequest(),
    provider: "mock-local",
    prompt: "local fallback"
  });
  assert.equal(mockRender.ok, true);
  assert.equal(mockRender.provider, "mock-local");
  assertValidPngDataUrl(mockRender.imageDataUrl);
  assert.notEqual(mockRender.imageDataUrl, transparentPixel);

  const sourceChangedMock = await postJson(`http://127.0.0.1:${localAppPort}/api/realtime-render`, {
    ...renderRequest(),
    provider: "mock-local",
    sourceImageDataUrl: "data:image/png;base64,c291cmNlLTI=",
    prompt: "local fallback"
  });
  const maskChangedMock = await postJson(`http://127.0.0.1:${localAppPort}/api/realtime-render`, {
    ...renderRequest(),
    provider: "mock-local",
    maskDataUrl: "data:image/png;base64,bWFzay0y",
    prompt: "local fallback"
  });
  const promptChangedMock = await postJson(`http://127.0.0.1:${localAppPort}/api/realtime-render`, {
    ...renderRequest(),
    provider: "mock-local",
    prompt: "different local fallback"
  });
  for (const item of [sourceChangedMock, maskChangedMock, promptChangedMock]) {
    assert.equal(item.ok, true);
    assert.equal(item.provider, "mock-local");
    assertValidPngDataUrl(item.imageDataUrl);
    assert.notEqual(item.imageDataUrl, mockRender.imageDataUrl);
  }

  const missingCustomRender = await postJson(`http://127.0.0.1:${localAppPort}/api/realtime-render`, {
    provider: "custom-http",
    prompt: "missing custom api"
  });
  assert.equal(missingCustomRender.ok, false);
  assert.equal(missingCustomRender.provider, "custom-http-missing");

  const missingOpenAiRender = await postJson(`http://127.0.0.1:${localAppPort}/api/realtime-render`, {
    provider: "openai",
    sourceImageDataUrl: transparentPixel,
    maskDataUrl: transparentPixel
  });
  assert.equal(missingOpenAiRender.ok, false);
  assert.equal(missingOpenAiRender.provider, "openai-missing");

  assert.ok(received.some((item) => item.payload.dcc_capture_bridge?.contract === "custom-http-json-v1"));
  assert.ok(received.some((item) => item.payload.dcc_capture_bridge?.test === true));

  console.log(JSON.stringify({
    api_contract_ok: true,
    mock_requests: received.length,
    app_port: appPort,
    local_app_port: localAppPort,
    mock_port: mockPort
  }));
} finally {
  stopApp(app);
  stopApp(localApp);
  stopApp(b64App);
  stopApp(missingImageApp);
  stopApp(openAiHtmlApp);
  stopApp(customMissingKeyApp);
  await new Promise((resolve) => mockApi.close(resolve));
}

function renderRequest() {
  return {
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
  };
}

function stripDataUrl(value) {
  return String(value).split(",")[1] || "";
}

function assertValidPngDataUrl(value) {
  assert.match(value, /^data:image\/png;base64,/);
  const bytes = Buffer.from(stripDataUrl(value), "base64");
  assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
}

function installTestLocalStorage() {
  const items = new Map();
  globalThis.localStorage = {
    getItem: (key) => items.has(key) ? items.get(key) : null,
    setItem: (key, value) => items.set(key, String(value)),
    removeItem: (key) => items.delete(key),
    clear: () => items.clear()
  };
}

function startApp(port, env = {}) {
  return spawn(process.execPath, ["serve-static.mjs"], {
    cwd: root,
    env: {
      ...process.env,
      DCC_SKIP_DOTENV: "1",
      OPENAI_API_KEY: "",
      DCC_CUSTOM_API_URL: "",
      DCC_CUSTOM_API_KEY: "",
      PORT: String(port),
      ...env
    },
    stdio: "ignore"
  });
}

function stopApp(appProcess) {
  if (!appProcess.killed) appProcess.kill();
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
