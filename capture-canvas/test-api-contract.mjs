import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import http from "node:http";
import { existsSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { callDirectCustomApi } from "./api-client.mjs";

const transparentPixel = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";
const mockPort = 21876;
const appPort = 21877;
const localAppPort = 21878;
const b64AppPort = 21879;
const missingImageAppPort = 21880;
const openAiHtmlAppPort = 21881;
const customMissingKeyAppPort = 21882;
const bflMissingKeyAppPort = 21883;
const received = [];
const savedOpenAiModel = "nanobanana-2-c";
const savedCustomModel = "pai-single-image-model";
const savedBflKey = "test-bfl-key";
const savedBflFastModel = "flux-2-klein-9b";
const savedBflFinalModel = "flux-2-pro";
const savedBflFlexModel = "flux-2-flex";

const mockApi = http.createServer(async (req, res) => {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  const payload = raw && req.headers["content-type"]?.includes("application/json") ? JSON.parse(raw) : {};
  received.push({ method: req.method, url: req.url, headers: req.headers, raw, payload });

  if (req.url === "/v1/images/edits") {
    res.writeHead(502, { "content-type": "text/html; charset=utf-8" });
    res.end("<!doctype html><title>Bad Gateway</title><h1>upstream unavailable</h1>");
    return;
  }
  if (req.url === `/saved-v1/images/edits`) {
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ data: [{ b64_json: stripDataUrl(transparentPixel) }] }));
    return;
  }
  if (req.url === `/html-v1/models/${savedOpenAiModel}`) {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end("<!doctype html><title>You need JS</title><main>You need JS</main>");
    return;
  }
  if (req.method === "POST" && req.url?.startsWith("/v1/flux-2-")) {
    if (payload.prompt === "submit failure") {
      res.writeHead(503, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ message: "bfl submit unavailable" }));
      return;
    }
    const pollCase = payload.prompt === "poll failed"
      ? "failed"
      : payload.prompt === "moderated request"
        ? "request-moderated"
        : payload.prompt === "moderated content"
          ? "content-moderated"
          : payload.prompt === "task not found"
            ? "task-not-found"
            : payload.prompt === "pending timeout"
              ? "pending"
              : payload.prompt === "missing sample"
                ? "missing-sample"
                : payload.prompt === "download failure"
                  ? "download-failure"
                  : "ready";
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ polling_url: `http://127.0.0.1:${mockPort}/bfl/poll/${pollCase}` }));
    return;
  }
  if (req.method === "GET" && req.url?.startsWith("/bfl/poll/")) {
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    if (req.url.endsWith("/failed")) {
      res.end(JSON.stringify({ status: "Failed", error: "render failed" }));
      return;
    }
    if (req.url.endsWith("/request-moderated")) {
      res.end(JSON.stringify({ status: "Request Moderated", details: { reason: "policy" } }));
      return;
    }
    if (req.url.endsWith("/content-moderated")) {
      res.end(JSON.stringify({ status: "Content Moderated", details: { reason: "policy" } }));
      return;
    }
    if (req.url.endsWith("/task-not-found")) {
      res.end(JSON.stringify({ status: "Task not found", details: { id: "missing" } }));
      return;
    }
    if (req.url.endsWith("/pending")) {
      res.end(JSON.stringify({ status: "Pending", progress: 0.25 }));
      return;
    }
    if (req.url.endsWith("/missing-sample")) {
      res.end(JSON.stringify({ status: "Ready", result: {} }));
      return;
    }
    if (req.url.endsWith("/download-failure")) {
      res.end(JSON.stringify({ status: "Ready", result: { sample: `http://127.0.0.1:${mockPort}/bfl/missing.png` } }));
      return;
    }
    res.end(JSON.stringify({ status: "Ready", result: { sample: `http://127.0.0.1:${mockPort}/bfl/sample.png` } }));
    return;
  }
  if (req.method === "GET" && req.url === "/bfl/sample.png") {
    res.writeHead(200, { "content-type": "image/png" });
    res.end(Buffer.from(stripDataUrl(transparentPixel), "base64"));
    return;
  }
  if (req.method === "GET" && req.url === "/bfl/missing.png") {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("missing sample");
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
const envPath = join(root, ".env");
const envBackup = existsSync(envPath) ? readFileSync(envPath, "utf8") : null;
const app = startApp(appPort, {
  DCC_CUSTOM_API_URL: `http://127.0.0.1:${mockPort}/render`,
  DCC_CUSTOM_API_KEY: "test-custom-key",
  DCC_CUSTOM_API_MODEL: savedCustomModel,
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
const bflMissingKeyApp = startApp(bflMissingKeyAppPort, {
  BFL_BASE_URL: `http://127.0.0.1:${mockPort}`
});

try {
  await waitForJson(`http://127.0.0.1:${appPort}/api/status`);
  await waitForJson(`http://127.0.0.1:${localAppPort}/api/status`);
  await waitForJson(`http://127.0.0.1:${b64AppPort}/api/status`);
  await waitForJson(`http://127.0.0.1:${missingImageAppPort}/api/status`);
  await waitForJson(`http://127.0.0.1:${openAiHtmlAppPort}/api/status`);
  await waitForJson(`http://127.0.0.1:${customMissingKeyAppPort}/api/status`);
  await waitForJson(`http://127.0.0.1:${bflMissingKeyAppPort}/api/status`);

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
  assert.equal(config.bfl.key_saved, false);
  assert.equal("api_key" in config.bfl, false);
  assert.equal("apiKey" in config.bfl, false);

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

  const bflMissingKeyTest = await postJson(`http://127.0.0.1:${bflMissingKeyAppPort}/api/test-provider`, { provider: "bfl-flux2" });
  assert.equal(bflMissingKeyTest.ok, false);
  assert.equal(bflMissingKeyTest.provider, "bfl-flux2-missing");
  assert.match(bflMissingKeyTest.message_en, /BFL_API_KEY/i);

  const savedBflConfig = await postJson(`http://127.0.0.1:${localAppPort}/api/config`, {
    provider: "bfl-flux2",
    baseUrl: `http://127.0.0.1:${mockPort}`,
    fastModel: savedBflFastModel,
    finalModel: savedBflFinalModel,
    flexModel: savedBflFlexModel,
    apiKey: savedBflKey
  });
  assert.equal(savedBflConfig.ok, true);
  assert.equal(savedBflConfig.config.bfl.base_url, `http://127.0.0.1:${mockPort}`);
  assert.equal(savedBflConfig.config.bfl.fast_model, savedBflFastModel);
  assert.equal(savedBflConfig.config.bfl.final_model, savedBflFinalModel);
  assert.equal(savedBflConfig.config.bfl.flex_model, savedBflFlexModel);
  assert.equal(savedBflConfig.config.bfl.key_saved, true);
  assert.equal("api_key" in savedBflConfig.config.bfl, false);
  assert.equal("apiKey" in savedBflConfig.config.bfl, false);

  const bflConfig = await getJson(`http://127.0.0.1:${localAppPort}/api/config`);
  assert.equal(bflConfig.bfl.key_saved, true);
  assert.equal("api_key" in bflConfig.bfl, false);
  assert.equal("apiKey" in bflConfig.bfl, false);

  const beforeBflProviderTest = countBflGenerationRequests();
  const bflProviderTest = await postJson(`http://127.0.0.1:${localAppPort}/api/test-provider`, { provider: "bfl-flux2" });
  assert.equal(bflProviderTest.ok, true);
  assert.equal(bflProviderTest.provider, "bfl-flux2");
  assert.equal(countBflGenerationRequests(), beforeBflProviderTest);

  const bflFastRender = await postJson(`http://127.0.0.1:${localAppPort}/api/realtime-render`, {
    ...renderRequest(),
    provider: "bfl-flux2",
    renderTier: "fast_preview"
  });
  assert.equal(bflFastRender.ok, true);
  assert.equal(bflFastRender.provider, "bfl-flux2");
  assert.equal(bflFastRender.imageDataUrl, transparentPixel);
  assertValidPngDataUrl(bflFastRender.imageDataUrl);
  assertBflRequest("/v1/flux-2-klein-9b", savedBflKey, "fast_preview");

  const bflFinalRender = await postJson(`http://127.0.0.1:${localAppPort}/api/realtime-render`, {
    ...renderRequest(),
    provider: "bfl-flux2",
    renderTier: "final_render"
  });
  assert.equal(bflFinalRender.ok, true);
  assert.equal(bflFinalRender.provider, "bfl-flux2");
  assert.equal(bflFinalRender.imageDataUrl, transparentPixel);
  assertBflRequest("/v1/flux-2-pro", savedBflKey, "final_render");

  const bflFlexRender = await postJson(`http://127.0.0.1:${localAppPort}/api/realtime-render`, {
    ...renderRequest(),
    provider: "bfl-flux2",
    renderTier: "flex"
  });
  assert.equal(bflFlexRender.ok, true);
  assert.equal(bflFlexRender.provider, "bfl-flux2");
  assert.equal(bflFlexRender.imageDataUrl, transparentPixel);
  assertBflRequest("/v1/flux-2-flex", savedBflKey, "flex");

  for (const [prompt, label] of [
    ["submit failure", "submit"],
    ["poll failed", "poll"],
    ["moderated request", "request moderated"],
    ["moderated content", "content moderated"],
    ["task not found", "task not found"],
    ["pending timeout", "pending timeout"],
    ["missing sample", "sample"],
    ["download failure", "download"]
  ]) {
    const failure = await postJson(`http://127.0.0.1:${localAppPort}/api/realtime-render`, {
      ...renderRequest(),
      provider: "bfl-flux2",
      renderTier: "fast_preview",
      prompt
    });
    assert.equal(failure.ok, false, `expected ${label} failure`);
    assert.equal(failure.provider, "bfl-flux2");
    assert.notEqual(failure.provider, "mock-local");
    assert.equal(failure.imageDataUrl || "", "");
  }

  const render = await postJson(`http://127.0.0.1:${appPort}/api/realtime-render`, renderRequest());
  assert.equal(render.ok, true);
  assert.equal(render.provider, "custom-http");
  assert.equal(render.imageDataUrl, transparentPixel);
  const customRenderRequest = received.find((item) => item.url === "/render" && item.payload.task === "regional_scene_generation");
  assert.ok(customRenderRequest, "expected Custom API render request");
  assert.equal(customRenderRequest.payload.model, savedCustomModel);

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
  assertPngDimensions(mockRender.imageDataUrl, { minWidth: 256, minHeight: 256 });
  assert.notEqual(mockRender.imageDataUrl, transparentPixel);

  const repeatedMock = await postJson(`http://127.0.0.1:${localAppPort}/api/realtime-render`, {
    ...renderRequest(),
    provider: "mock-local",
    prompt: "local fallback"
  });
  assert.equal(repeatedMock.imageDataUrl, mockRender.imageDataUrl);

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
    assertPngDimensions(item.imageDataUrl, { minWidth: 256, minHeight: 256 });
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

  const savedConfig = await postJson(`http://127.0.0.1:${localAppPort}/api/config`, {
    provider: "openai",
    baseUrl: `http://127.0.0.1:${mockPort}/saved-v1`,
    model: savedOpenAiModel,
    apiKey: "test-openai-key"
  });
  assert.equal(savedConfig.ok, true);
  assert.equal(savedConfig.config.openai.model, savedOpenAiModel);

  const savedOpenAiRender = await postJson(`http://127.0.0.1:${localAppPort}/api/realtime-render`, {
    ...renderRequest(),
    provider: "openai"
  });
  assert.equal(savedOpenAiRender.ok, true);
  assert.equal(savedOpenAiRender.provider, "openai");
  assert.equal(savedOpenAiRender.imageDataUrl, transparentPixel);
  const savedOpenAiRequest = received.find((item) => item.url === "/saved-v1/images/edits");
  assert.ok(savedOpenAiRequest, "expected saved OpenAI-compatible render request");
  assert.match(savedOpenAiRequest.raw, new RegExp(`name="model"[\\s\\S]*${savedOpenAiModel}`));
  assert.doesNotMatch(savedOpenAiRequest.raw, /gpt-image-1/);

  const htmlModelTest = await postJson(`http://127.0.0.1:${localAppPort}/api/test-provider`, {
    provider: "openai",
    baseUrl: `http://127.0.0.1:${mockPort}/html-v1`,
    model: savedOpenAiModel,
    apiKey: "test-openai-key"
  });
  assert.equal(htmlModelTest.ok, false);
  assert.equal(htmlModelTest.provider, "openai");
  assert.equal(htmlModelTest.status, 200);
  assert.match(`${htmlModelTest.message_en} ${htmlModelTest.message_cn}`, /JSON/i);
  assert.match(`${htmlModelTest.message_en} ${htmlModelTest.message_cn}`, /HTML/i);
  assert.match(`${htmlModelTest.message_en} ${htmlModelTest.message_cn}`, /compatible/i);

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
  stopApp(bflMissingKeyApp);
  await new Promise((resolve) => mockApi.close(resolve));
  restoreEnvFile();
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

function restoreEnvFile() {
  if (envBackup === null) {
    if (existsSync(envPath)) unlinkSync(envPath);
    return;
  }
  writeFileSync(envPath, envBackup, "utf8");
}

function assertValidPngDataUrl(value) {
  assert.match(value, /^data:image\/png;base64,/);
  const bytes = Buffer.from(stripDataUrl(value), "base64");
  assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
}

function assertPngDimensions(value, { minWidth, minHeight }) {
  const bytes = Buffer.from(stripDataUrl(value), "base64");
  assert.equal(bytes.subarray(12, 16).toString("ascii"), "IHDR");
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  assert.ok(width >= minWidth, `expected PNG width >= ${minWidth}, got ${width}`);
  assert.ok(height >= minHeight, `expected PNG height >= ${minHeight}, got ${height}`);
}

function countBflGenerationRequests() {
  return received.filter((item) => item.method === "POST" && item.url?.startsWith("/v1/flux-2-")).length;
}

function assertBflRequest(url, key, renderTier) {
  const request = received.find((item) => item.method === "POST" && item.url === url);
  assert.ok(request, `expected BFL request ${url} for ${renderTier}`);
  assert.equal(request.headers["x-key"], key);
  assert.equal(request.payload.input_image, transparentPixel);
  assert.equal("sourceImageDataUrl" in request.payload, false);
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
      BFL_API_KEY: "",
      BFL_BASE_URL: "",
      BFL_FAST_MODEL: "",
      BFL_FINAL_MODEL: "",
      BFL_FLEX_MODEL: "",
      BFL_POLL_TIMEOUT_MS: "1000",
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
