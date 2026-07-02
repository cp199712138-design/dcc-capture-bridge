import http from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { extname, isAbsolute, join, normalize, relative } from "node:path";
import { createMockImageDataUrl, normalizeImageDataUrl } from "../API/task-api.mjs";

const root = normalize(process.cwd());
const port = Number(process.env.PORT || 8765);
const OPENAI_IMAGE_MODEL_DEFAULT = "gpt-image-1";
const BFL_BASE_URL_DEFAULT = "https://api.bfl.ai";
const BFL_FAST_MODEL_DEFAULT = "flux-2-klein-9b";
const BFL_FINAL_MODEL_DEFAULT = "flux-2-pro";
const BFL_FLEX_MODEL_DEFAULT = "flux-2-flex";
const TRANSPARENT_PIXEL_DATA_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";
loadLocalEnv();
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://127.0.0.1");

    if (req.method === "GET" && url.pathname === "/api/status") {
      const provider = chooseRuntimeProvider({});
      sendJson(res, 200, {
        ok: true,
        provider,
        openai_configured: Boolean(process.env.OPENAI_API_KEY),
        openai_host: safeHost(process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"),
        bfl_configured: Boolean(process.env.BFL_API_KEY),
        bfl_host: safeHost(process.env.BFL_BASE_URL || BFL_BASE_URL_DEFAULT),
        custom_api_configured: Boolean(process.env.DCC_CUSTOM_API_URL && process.env.DCC_CUSTOM_API_KEY),
        custom_api_host: safeHost(process.env.DCC_CUSTOM_API_URL),
        has_api_key: Boolean(process.env.OPENAI_API_KEY || process.env.DCC_CUSTOM_API_KEY || process.env.BFL_API_KEY)
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/config") {
      sendJson(res, 200, getProviderConfig());
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/config") {
      const body = await readJsonBody(req);
      const result = saveProviderConfig(body);
      sendJson(res, 200, result);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/test-provider") {
      const body = await readJsonBody(req);
      const result = await handleProviderTest(body);
      sendJson(res, 200, result);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/realtime-render") {
      const body = await readJsonBody(req);
      const result = await handleRealtimeRender(body);
      sendJson(res, 200, result);
      return;
    }

    const requestPath = decodeURIComponent(url.pathname);
    const relativePath = requestPath === "/" ? "capture-canvas/index.html" : requestPath.replace(/^\/+/, "");
    let file = normalize(join(root, relativePath));
    if (!existsSync(file) && relativePath.startsWith("capture-canvas/")) {
      file = normalize(join(root, relativePath.slice("capture-canvas/".length)));
    }
    if (!isInsideRoot(file) || !existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    res.writeHead(200, {
      "content-type": types[extname(file).toLowerCase()] || "application/octet-stream",
      "cache-control": "no-store"
    });
    res.end(await readFile(file));
  } catch (error) {
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end(String(error.stack || error));
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Instant Canvas http://127.0.0.1:${port}/capture-canvas/index.html`);
});

function sendJson(res, status, data) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function isInsideRoot(file) {
  const pathFromRoot = relative(root, file);
  return pathFromRoot === "" || (!pathFromRoot.startsWith("..") && !isAbsolute(pathFromRoot));
}

async function readJsonBody(req) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 20_000_000) throw new Error("Request body too large");
  }
  return raw ? JSON.parse(raw) : {};
}

async function handleRealtimeRender(body) {
  const provider = chooseRuntimeProvider(body);
  if (provider === "openai-missing") return missingOpenAiConfig();
  if (provider === "custom-http-missing") return missingCustomConfig();
  if (provider === "bfl-flux2-missing") return missingBflConfig();
  if (provider === "custom-http") return handleCustomRender(body);
  if (provider === "bfl-flux2") return handleBflRender(body);
  if (provider !== "openai") {
    const imageDataUrl = createMockImageDataUrl(body);
    return {
      ok: true,
      provider: "mock-local",
      imageDataUrl,
      cn: "\u672c\u5730\u9884\u89c8",
      en: "Local Preview",
      message_cn: "\u6ca1\u6709\u68c0\u6d4b\u5230 OPENAI_API_KEY\uff0c\u6240\u4ee5\u53f3\u4fa7\u4f7f\u7528\u672c\u5730\u5b9e\u65f6\u9884\u89c8\u3002\u914d\u7f6e key \u540e\u4f1a\u8d70 API\u3002",
      message_en: "OPENAI_API_KEY was not found, so the right side uses local realtime preview. Add a key to use the API."
    };
  }

  const prompt = String(body.prompt || "").trim();
  const source = stripDataUrl(body.sourceImageDataUrl);
  const mask = stripDataUrl(body.maskDataUrl);
  if (!source || !mask) {
    return {
      ok: false,
      provider: "openai",
      cn: "\u7f3a\u5c11\u8f93\u5165",
      en: "Missing Input",
      message_cn: "API \u9700\u8981\u8f93\u5165\u56fe\u548c\u906e\u7f69\u3002",
      message_en: "The API needs a source image and a mask."
    };
  }

  const config = providerConfigFromRequest(body).openai;
  const form = new FormData();
  form.set("model", config.model || OPENAI_IMAGE_MODEL_DEFAULT);
  form.set("prompt", prompt || "Render the selected region as a clean product scene while preserving the source structure.");
  form.set("size", chooseApiSize(body.aspectRatio));
  form.set("quality", "low");
  form.append("image[]", new Blob([Buffer.from(source, "base64")], { type: "image/png" }), "source.png");
  form.set("mask", new Blob([Buffer.from(mask, "base64")], { type: "image/png" }), "mask.png");

  const openAiBase = normalizeBaseUrl(config.baseUrl || "https://api.openai.com/v1");
  let response;
  try {
    response = await fetch(`${openAiBase}/images/edits`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.apiKey}`
      },
      body: form
    });
  } catch (error) {
    return providerRequestException("openai", error);
  }

  const text = await response.text();
  const data = parseJsonResponse(text);
  if (!response.ok) {
    const short = summarizeResponse(text) || "OpenAI API request failed.";
    return {
      ok: false,
      provider: "openai",
      status: response.status,
      cn: "API \u9519\u8bef",
      en: "API Error",
      message_cn: `API \u8fd4\u56de ${response.status}: ${short}`,
      message_en: `API returned ${response.status}: ${short}`
    };
  }

  const imageDataUrl = extractImageDataUrl(data);
  const short = imageDataUrl ? "" : summarizeResponse(text);
  return {
    ok: Boolean(imageDataUrl),
    provider: "openai",
    imageDataUrl,
    cn: imageDataUrl ? "API \u8f93\u51fa" : "\u6ca1\u6709\u56fe\u50cf",
    en: imageDataUrl ? "API Output" : "No Image",
    message_cn: imageDataUrl ? "API \u5df2\u8fd4\u56de\u56fe\u50cf\u3002" : `API \u6ca1\u6709\u8fd4\u56de\u56fe\u50cf\u6570\u636e\u3002${short ? ` ${short}` : ""}`,
    message_en: imageDataUrl ? "API returned an image." : `API did not return image data.${short ? ` ${short}` : ""}`
  };
}

async function handleProviderTest(body) {
  const config = providerConfigFromRequest(body);
  const provider = String(body.provider || "auto");

  if (provider === "openai") {
    if (!config.openai.apiKey) return missingOpenAiConfig();
    const baseUrl = normalizeBaseUrl(config.openai.baseUrl || "https://api.openai.com/v1");
    const model = config.openai.model || OPENAI_IMAGE_MODEL_DEFAULT;
    try {
      const response = await fetchWithTimeout(`${baseUrl}/models/${encodeURIComponent(model)}`, {
        headers: { authorization: `Bearer ${config.openai.apiKey}` }
      });
      const text = await response.text();
      if (!response.ok) {
        return providerTestError("openai", response.status, text, "OpenAI API key or model check failed.");
      }
      const data = parseJsonStrict(text);
      if (!data) {
        return openAiCompatibleJsonError(response.status, text);
      }
      if (!data.id && !data.object) {
        return openAiCompatibleJsonError(response.status, text);
      }
      return {
        ok: true,
        provider: "openai",
        model,
        host: safeHost(baseUrl),
        cn: "OpenAI \u8fde\u63a5\u901a\u8fc7",
        en: "OpenAI connection passed",
        message_cn: `OpenAI \u5df2\u8fde\u901a\uff0c\u6a21\u578b: ${model}`,
        message_en: `OpenAI is reachable. Model: ${model}`
      };
    } catch (error) {
      return providerTestException("openai", error);
    }
  }

  if (provider === "custom-http") {
    if (!config.custom.url) return missingCustomConfig();
    if (!config.custom.apiKey) return missingCustomKeyConfig();
    try {
      const response = await callCustomEndpoint({
        config: config.custom,
        payload: customRequestPayload({
          schema_version: "0.2.0",
          session_id: "dcc_connection_test",
          task: "connection_test",
          prompt: "Instant Canvas connection test",
          strength: 0,
          assets: [],
          mask: { type: "none", strokes: [] },
          output: { target: "healthcheck", mode: "connection_test", type: "image" },
          sourceImageDataUrl: TRANSPARENT_PIXEL_DATA_URL,
          maskDataUrl: TRANSPARENT_PIXEL_DATA_URL,
          reason: "api-test"
        }, true)
      });
      const text = await response.text();
      if (!response.ok) {
        return providerTestError("custom-http", response.status, text, "Custom API request failed.");
      }
      return {
        ok: true,
        provider: "custom-http",
        host: safeHost(config.custom.url),
        cn: "\u81ea\u5b9a\u4e49 API \u8fde\u63a5\u901a\u8fc7",
        en: "Custom API connection passed",
        message_cn: "\u81ea\u5b9a\u4e49 API \u5df2\u63a5\u6536\u6807\u51c6\u6d4b\u8bd5 payload\u3002",
        message_en: "Custom API accepted the standard test payload."
      };
    } catch (error) {
      return providerTestException("custom-http", error);
    }
  }

  if (provider === "bfl-flux2") {
    if (!config.bfl.apiKey) return missingBflConfig();
    return {
      ok: true,
      provider: "bfl-flux2",
      host: safeHost(config.bfl.baseUrl),
      cn: "BFL FLUX.2 \u914d\u7f6e\u5df2\u5c31\u7eea",
      en: "BFL FLUX.2 configured",
      message_cn: "BFL API key \u5df2\u4fdd\u5b58\u3002\u6b64\u68c0\u67e5\u4e0d\u8c03\u7528\u751f\u6210\u7aef\u70b9\uff0c\u4e5f\u4e0d\u9a8c\u8bc1\u989d\u5ea6\u3001\u6a21\u578b\u6216\u751f\u6210\u53ef\u7528\u6027\u3002",
      message_en: "BFL API key is saved. Generation endpoints were not called, so this does not validate credits, model access, or render availability."
    };
  }

  return {
    ok: false,
    provider: "mock-local",
    cn: "\u672c\u5730\u9884\u89c8",
    en: "Local Preview",
    message_cn: "\u5f53\u524d\u662f\u672c\u5730\u9884\u89c8\uff0c\u8bf7\u9009\u62e9 OpenAI \u6216\u81ea\u5b9a\u4e49 API \u518d\u6d4b\u8bd5\u3002",
    message_en: "Local preview is active. Choose OpenAI or Custom API to test a remote provider."
  };
}

function getProviderConfig() {
  return {
    ok: true,
    openai: {
      base_url: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
      model: process.env.OPENAI_IMAGE_MODEL || OPENAI_IMAGE_MODEL_DEFAULT,
      key_saved: Boolean(process.env.OPENAI_API_KEY)
    },
    custom: {
      base_url: process.env.DCC_CUSTOM_API_URL || "",
      model: process.env.DCC_CUSTOM_API_MODEL || "",
      auth_header: process.env.DCC_CUSTOM_API_AUTH_HEADER || "authorization",
      auth_scheme: process.env.DCC_CUSTOM_API_AUTH_SCHEME || "Bearer",
      method: process.env.DCC_CUSTOM_API_METHOD || "POST",
      key_saved: Boolean(process.env.DCC_CUSTOM_API_KEY)
    },
    bfl: {
      base_url: process.env.BFL_BASE_URL || BFL_BASE_URL_DEFAULT,
      fast_model: process.env.BFL_FAST_MODEL || BFL_FAST_MODEL_DEFAULT,
      final_model: process.env.BFL_FINAL_MODEL || BFL_FINAL_MODEL_DEFAULT,
      flex_model: process.env.BFL_FLEX_MODEL || BFL_FLEX_MODEL_DEFAULT,
      key_saved: Boolean(process.env.BFL_API_KEY)
    }
  };
}

function saveProviderConfig(body) {
  const provider = String(body.provider || "");
  if (provider !== "openai" && provider !== "custom-http" && provider !== "bfl-flux2") {
    return { ok: false, message: "Unsupported provider" };
  }

  const updates = {};
  if (provider === "openai") {
    updates.OPENAI_BASE_URL = String(body.baseUrl || "https://api.openai.com/v1").trim();
    updates.OPENAI_IMAGE_MODEL = String(body.model || OPENAI_IMAGE_MODEL_DEFAULT).trim();
    if (String(body.apiKey || "").trim()) updates.OPENAI_API_KEY = String(body.apiKey).trim();
  } else if (provider === "custom-http") {
    updates.DCC_CUSTOM_API_URL = String(body.baseUrl || "").trim();
    updates.DCC_CUSTOM_API_MODEL = String(body.model || "").trim();
    updates.DCC_CUSTOM_API_AUTH_HEADER = String(body.authHeader || "authorization").trim();
    updates.DCC_CUSTOM_API_AUTH_SCHEME = String(body.authScheme || "Bearer").trim();
    updates.DCC_CUSTOM_API_METHOD = String(body.method || "POST").trim();
    if (String(body.apiKey || "").trim()) updates.DCC_CUSTOM_API_KEY = String(body.apiKey).trim();
  } else if (provider === "bfl-flux2") {
    updates.BFL_BASE_URL = String(body.baseUrl || BFL_BASE_URL_DEFAULT).trim();
    updates.BFL_FAST_MODEL = String(body.fastModel || BFL_FAST_MODEL_DEFAULT).trim();
    updates.BFL_FINAL_MODEL = String(body.finalModel || BFL_FINAL_MODEL_DEFAULT).trim();
    updates.BFL_FLEX_MODEL = String(body.flexModel || BFL_FLEX_MODEL_DEFAULT).trim();
    if (String(body.apiKey || "").trim()) updates.BFL_API_KEY = String(body.apiKey).trim();
  }

  writeEnvUpdates(updates);
  Object.assign(process.env, updates);
  return { ok: true, config: getProviderConfig() };
}

function writeEnvUpdates(updates) {
  const envPath = join(root, ".env");
  const current = {};
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const index = trimmed.indexOf("=");
      current[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim();
    }
  }
  for (const [key, value] of Object.entries(updates)) {
    if (value !== "") current[key] = sanitizeEnvValue(value);
  }
  const ordered = [
    "OPENAI_BASE_URL",
    "OPENAI_API_KEY",
    "OPENAI_IMAGE_MODEL",
    "BFL_BASE_URL",
    "BFL_API_KEY",
    "BFL_FAST_MODEL",
    "BFL_FINAL_MODEL",
    "BFL_FLEX_MODEL",
    "DCC_CUSTOM_API_URL",
    "DCC_CUSTOM_API_KEY",
    "DCC_CUSTOM_API_MODEL",
    "DCC_CUSTOM_API_AUTH_HEADER",
    "DCC_CUSTOM_API_AUTH_SCHEME",
    "DCC_CUSTOM_API_METHOD",
    "DCC_CUSTOM_API_HEADERS"
  ];
  const keys = [...ordered, ...Object.keys(current).filter((key) => !ordered.includes(key)).sort()];
  const lines = ["# Local only. Do not commit this file."];
  for (const key of keys) {
    if (current[key] !== undefined) lines.push(`${key}=${current[key]}`);
  }
  lines.push("");
  writeFileSync(envPath, lines.join("\n"), "utf8");
}

function chooseRuntimeProvider(body) {
  const requested = String(body.provider || "auto");
  if (requested === "mock-local") return "mock-local";
  if (requested === "custom-http") {
    const config = providerConfigFromRequest(body).custom;
    return config.url && config.apiKey ? "custom-http" : "custom-http-missing";
  }
  if (requested === "openai") {
    const config = providerConfigFromRequest(body).openai;
    return config.apiKey ? "openai" : "openai-missing";
  }
  if (requested === "bfl-flux2") {
    const config = providerConfigFromRequest(body).bfl;
    return config.apiKey ? "bfl-flux2" : "bfl-flux2-missing";
  }
  return "mock-local";
}

function sanitizeEnvValue(value) {
  return String(value || "").replace(/[\r\n]+/g, " ").trim();
}

function missingOpenAiConfig() {
  return {
    ok: false,
    provider: "openai-missing",
    cn: "OpenAI \u672a\u914d\u7f6e",
    en: "OpenAI Not Configured",
    message_cn: "\u8bf7\u5728 API Settings \u4fdd\u5b58 OPENAI_API_KEY\uff0c\u6216\u5728 .env / \u547d\u4ee4\u884c\u8bbe\u7f6e\u3002",
    message_en: "Save OPENAI_API_KEY in API Settings, or set it in .env / your shell."
  };
}

function missingCustomConfig() {
  return {
    ok: false,
    provider: "custom-http-missing",
    cn: "\u81ea\u5b9a\u4e49 API \u672a\u914d\u7f6e",
    en: "Custom API Not Configured",
    message_cn: "\u8bf7\u5728 API Settings \u4fdd\u5b58 DCC_CUSTOM_API_URL \u548c DCC_CUSTOM_API_KEY\uff0c\u6216\u5728 .env \u8bbe\u7f6e\u3002",
    message_en: "Save DCC_CUSTOM_API_URL and DCC_CUSTOM_API_KEY in API Settings, or set them in .env."
  };
}

function missingCustomKeyConfig() {
  return {
    ok: false,
    provider: "custom-http-missing",
    cn: "\u81ea\u5b9a\u4e49 API Key \u672a\u914d\u7f6e",
    en: "Custom API Key Not Configured",
    message_cn: "\u8bf7\u5728 API Settings \u4fdd\u5b58 DCC_CUSTOM_API_KEY\uff0c\u6216\u5728 .env \u8bbe\u7f6e\u3002",
    message_en: "Save DCC_CUSTOM_API_KEY in API Settings, or set it in .env."
  };
}

function missingBflConfig() {
  return {
    ok: false,
    provider: "bfl-flux2-missing",
    cn: "BFL FLUX.2 \u672a\u914d\u7f6e",
    en: "BFL FLUX.2 Not Configured",
    message_cn: "\u8bf7\u5728 API Settings \u4fdd\u5b58 BFL_API_KEY\uff0c\u6216\u5728 .env / \u547d\u4ee4\u884c\u8bbe\u7f6e\u3002",
    message_en: "Save BFL_API_KEY in API Settings, or set it in .env / your shell."
  };
}

async function handleCustomRender(body) {
  if (!process.env.DCC_CUSTOM_API_URL) {
    return {
      ok: false,
      provider: "custom-http",
      cn: "\u81ea\u5b9a\u4e49 API \u672a\u914d\u7f6e",
      en: "Custom API Missing",
      message_cn: "\u9700\u8981\u8bbe\u7f6e DCC_CUSTOM_API_URL \u540e\u624d\u80fd\u8c03\u7528\u5ba2\u6237\u81ea\u5df1\u7684 API\u3002",
      message_en: "Set DCC_CUSTOM_API_URL to call a customer-owned API."
    };
  }

  const config = providerConfigFromRequest({ ...body, provider: "custom-http" }).custom;
  let response;
  try {
    response = await callCustomEndpoint({
      config,
      payload: customRequestPayload({ ...body, model: body.model || config.model })
    });
  } catch (error) {
    return providerRequestException("custom-http", error);
  }

  const text = await response.text();
  const data = parseJsonResponse(text);

  if (!response.ok) {
    return {
      ok: false,
      provider: "custom-http",
      cn: "\u81ea\u5b9a\u4e49 API \u9519\u8bef",
      en: "Custom API Error",
      message_cn: data.message || data.error?.message || "\u5ba2\u6237 API \u8bf7\u6c42\u5931\u8d25\u3002",
      message_en: data.message || data.error?.message || "Customer API request failed."
    };
  }

  const imageDataUrl = extractImageDataUrl(data);
  if (!imageDataUrl) {
    const short = summarizeResponse(text) || "Custom API returned no image data.";
    return {
      ok: false,
      provider: "custom-http",
      imageDataUrl: "",
      cn: "\u81ea\u5b9a\u4e49 API \u6ca1\u6709\u56fe\u50cf",
      en: "Custom API returned no image",
      message_cn: `\u5ba2\u6237 API \u5df2\u54cd\u5e94\uff0c\u4f46\u6ca1\u6709\u8fd4\u56de imageDataUrl \u6216 b64_json: ${short}`,
      message_en: `Customer API responded but did not return imageDataUrl or b64_json: ${short}`
    };
  }
  return {
    ok: true,
    provider: "custom-http",
    imageDataUrl,
    cn: "\u81ea\u5b9a\u4e49 API \u8f93\u51fa",
    en: "Custom API Output",
    message_cn: data.message_cn || data.message || "\u5ba2\u6237 API \u5df2\u8fd4\u56de\u3002",
    message_en: data.message_en || data.message || "Customer API returned a response."
  };
}

async function handleBflRender(body) {
  const config = providerConfigFromRequest(body).bfl;
  if (!config.apiKey) return missingBflConfig();

  const renderTier = String(body.renderTier || "fast_preview");
  const model = chooseBflModel(config, renderTier);
  const payload = {
    prompt: String(body.prompt || "").trim(),
    input_image: body.sourceImageDataUrl || undefined,
    seed: Number.isFinite(Number(body.seed)) ? Number(body.seed) : undefined,
    output_format: "png"
  };
  const aspectRatio = normalizeBflAspectRatio(body.output?.aspect_ratio || body.aspectRatio);
  if (aspectRatio) payload.aspect_ratio = aspectRatio;

  let response;
  try {
    response = await fetchWithTimeout(`${normalizeBaseUrl(config.baseUrl)}/v1/${encodeURIComponent(model)}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-key": config.apiKey
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    return providerRequestException("bfl-flux2", error);
  }

  const text = await response.text();
  const data = parseJsonResponse(text);
  if (!response.ok) {
    return bflError(response.status, text, "BFL FLUX.2 submit failed.");
  }
  if (!data.polling_url) {
    return bflError(response.status, text, "BFL FLUX.2 did not return polling_url.");
  }

  return pollBflResult(data.polling_url, config, { renderTier, model, submit: data });
}

async function pollBflResult(pollingUrl, config, meta = {}) {
  let lastText = "";
  const started = Date.now();
  const timeoutMs = Math.max(1000, Number(process.env.BFL_POLL_TIMEOUT_MS || 90000));
  let attempt = 0;
  while (Date.now() - started < timeoutMs) {
    let response;
    try {
      response = await fetchWithTimeout(resolveBflUrl(pollingUrl, config.baseUrl), {
        headers: { "x-key": config.apiKey }
      }, 20000);
    } catch (error) {
      return providerRequestException("bfl-flux2", error);
    }

    lastText = await response.text();
    const data = parseJsonResponse(lastText);
    if (!response.ok) return bflError(response.status, lastText, "BFL FLUX.2 polling failed.");

    const status = normalizeBflStatus(data.status);
    if (status === "error" || status === "failed") return bflError(response.status, lastText, "BFL FLUX.2 render failed.");
    if (status === "request moderated") return bflError(response.status, lastText, "BFL FLUX.2 request was moderated.");
    if (status === "content moderated") return bflError(response.status, lastText, "BFL FLUX.2 content was moderated.");
    if (status === "task not found") return bflError(response.status, lastText, "BFL FLUX.2 task was not found.");
    if (status === "ready") {
      if (!data.result?.sample) return bflError(response.status, lastText, "BFL FLUX.2 returned no result.sample.");
      return downloadBflSample(data.result.sample, config, meta);
    }

    attempt += 1;
    await new Promise((resolve) => setTimeout(resolve, Math.min(3000, 700 + attempt * 250)));
  }
  return bflError(408, lastText, "BFL FLUX.2 is still pending after 90 seconds. Try again later or use Fast preview.");
}

function normalizeBflStatus(value) {
  return String(value || "pending").trim().toLowerCase();
}

function normalizeBflAspectRatio(value) {
  const text = String(value || "").trim();
  return /^(?:[1-9]\d?):(?:[1-9]\d?)$/.test(text) ? text : "";
}

async function downloadBflSample(sampleUrl, config, meta = {}) {
  let response;
  try {
    response = await fetchWithTimeout(resolveBflUrl(sampleUrl, config.baseUrl), {
      headers: { "x-key": config.apiKey }
    });
  } catch (error) {
    return providerRequestException("bfl-flux2", error);
  }
  if (!response.ok) {
    const text = await response.text();
    return bflError(response.status, text, "BFL FLUX.2 sample download failed.");
  }
  const contentType = response.headers.get("content-type")?.split(";")[0] || "image/png";
  const bytes = Buffer.from(await response.arrayBuffer());
  return {
    ok: true,
    provider: "bfl-flux2",
    renderTier: meta.renderTier || "fast_preview",
    model: meta.model || "",
    id: meta.submit?.id || "",
    cost: meta.submit?.cost ?? null,
    input_mp: meta.submit?.input_mp ?? null,
    output_mp: meta.submit?.output_mp ?? null,
    imageDataUrl: `data:${contentType};base64,${bytes.toString("base64")}`,
    cn: "BFL FLUX.2 \u8f93\u51fa",
    en: "BFL FLUX.2 Output",
    message_cn: "BFL FLUX.2 \u5df2\u8fd4\u56de\u56fe\u50cf\u3002",
    message_en: "BFL FLUX.2 returned an image."
  };
}

function providerConfigFromRequest(body = {}) {
  return {
    openai: {
      baseUrl: String(body.baseUrl || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").trim(),
      apiKey: String(body.apiKey || process.env.OPENAI_API_KEY || "").trim(),
      model: String(body.model || process.env.OPENAI_IMAGE_MODEL || OPENAI_IMAGE_MODEL_DEFAULT).trim()
    },
    custom: {
      url: String(body.baseUrl || process.env.DCC_CUSTOM_API_URL || "").trim(),
      apiKey: String(body.apiKey || process.env.DCC_CUSTOM_API_KEY || "").trim(),
      model: String(body.model || process.env.DCC_CUSTOM_API_MODEL || "").trim(),
      authHeader: String(body.authHeader || process.env.DCC_CUSTOM_API_AUTH_HEADER || "authorization").trim(),
      authScheme: String(body.authScheme || process.env.DCC_CUSTOM_API_AUTH_SCHEME || "Bearer").trim(),
      method: String(body.method || process.env.DCC_CUSTOM_API_METHOD || "POST").trim().toUpperCase(),
      headers: parseJsonEnv("DCC_CUSTOM_API_HEADERS")
    },
    bfl: {
      baseUrl: String(body.baseUrl || process.env.BFL_BASE_URL || BFL_BASE_URL_DEFAULT).trim(),
      apiKey: String(body.apiKey || process.env.BFL_API_KEY || "").trim(),
      fastModel: String(body.fastModel || process.env.BFL_FAST_MODEL || BFL_FAST_MODEL_DEFAULT).trim(),
      finalModel: String(body.finalModel || process.env.BFL_FINAL_MODEL || BFL_FINAL_MODEL_DEFAULT).trim(),
      flexModel: String(body.flexModel || process.env.BFL_FLEX_MODEL || BFL_FLEX_MODEL_DEFAULT).trim()
    }
  };
}

function normalizeBaseUrl(value) {
  return String(value || "https://api.openai.com/v1").replace(/\/+$/, "");
}

function chooseBflModel(config, renderTier) {
  if (renderTier === "final_render") return config.finalModel;
  if (renderTier === "flex") return config.flexModel;
  return config.fastModel;
}

function resolveBflUrl(value, baseUrl) {
  return new URL(value, `${normalizeBaseUrl(baseUrl)}/`).toString();
}

function customRequestPayload(body, isTest = false) {
  return {
    schema_version: body.schema_version,
    session_id: body.session_id,
    model: body.model || "",
    task: body.task || "regional_scene_generation",
    prompt: body.prompt || "",
    strength: body.strength,
    assets: body.assets || [],
    mask: body.mask || {},
    output: body.output || {},
    sourceImageDataUrl: body.sourceImageDataUrl || "",
    maskDataUrl: body.maskDataUrl || "",
    reason: body.reason || "preview",
    dcc_capture_bridge: {
      test: Boolean(isTest),
      contract: "custom-http-json-v1"
    }
  };
}

async function callCustomEndpoint({ config, payload }) {
  const headers = {
    "content-type": "application/json",
    ...(config.headers || {})
  };
  if (config.apiKey) {
    headers[config.authHeader || "authorization"] = config.authScheme ? `${config.authScheme} ${config.apiKey}` : config.apiKey;
  }

  const method = config.method || "POST";
  const url = method === "GET" ? withQuery(config.url, "dcc_test", payload.reason === "api-test" ? "1" : "0") : config.url;
  return fetchWithTimeout(url, {
    method,
    headers,
    body: method === "GET" ? undefined : JSON.stringify(payload)
  });
}

function withQuery(value, key, queryValue) {
  const url = new URL(value);
  url.searchParams.set(key, queryValue);
  return url.toString();
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function providerTestError(provider, status, text, fallback) {
  const short = summarizeResponse(text) || fallback;
  return {
    ok: false,
    provider,
    status,
    cn: "API \u8fde\u63a5\u5931\u8d25",
    en: "API connection failed",
    message_cn: `API \u8fd4\u56de ${status}: ${short}`,
    message_en: `API returned ${status}: ${short}`
  };
}

function providerTestException(provider, error) {
  const text = String(error.message || error);
  return {
    ok: false,
    provider,
    cn: "API \u8fde\u63a5\u5931\u8d25",
    en: "API connection failed",
    message_cn: text,
    message_en: text
  };
}

function openAiCompatibleJsonError(status, text) {
  const short = summarizeResponse(text) || "No response body.";
  return {
    ok: false,
    provider: "openai",
    status,
    cn: "API \u7aef\u70b9\u4e0d\u517c\u5bb9",
    en: "API endpoint is not compatible",
    message_cn: `API \u8fd4\u56de ${status}\uff0c\u4f46 /models \u7aef\u70b9\u8fd4\u56de\u7684\u662f HTML \u6216\u975e OpenAI-compatible JSON model metadata\u3002\u6458\u8981: ${short}`,
    message_en: `API returned ${status}, but the /models endpoint returned HTML or non OpenAI-compatible JSON model metadata. Summary: ${short}`
  };
}

function providerRequestException(provider, error) {
  const text = redactSensitiveText(String(error.message || error));
  return {
    ok: false,
    provider,
    cn: "API \u8bf7\u6c42\u5931\u8d25",
    en: "API request failed",
    message_cn: text,
    message_en: text
  };
}

function bflError(status, text, fallback) {
  const short = redactSensitiveText(summarizeResponse(text) || fallback);
  return {
    ok: false,
    provider: "bfl-flux2",
    status,
    imageDataUrl: "",
    cn: "BFL FLUX.2 \u9519\u8bef",
    en: "BFL FLUX.2 Error",
    message_cn: `BFL FLUX.2 \u8fd4\u56de ${status}: ${short}`,
    message_en: `BFL FLUX.2 returned ${status}: ${short}`
  };
}

function summarizeResponse(text) {
  if (!text) return "";
  try {
    const data = JSON.parse(text);
    return redactSensitiveText(data.error?.message || data.message || data.details?.message || JSON.stringify(data).slice(0, 240));
  } catch {
    return redactSensitiveText(summarizeHtmlText(text));
  }
}

function redactSensitiveText(text) {
  return String(text || "")
    .replace(/sk-(?!\.{3})(?:proj-)?[A-Za-z0-9_-]{12,}/g, "sk-...[redacted]")
    .replace(/(x-key|authorization|api[_-]?key)(\s*[:=]\s*)(Bearer\s+)?[^\s,"'}]+/gi, "$1$2[redacted]");
}

function parseJsonResponse(text) {
  if (!text) return {};
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return { message: summarizeHtmlText(text) };
  }
}

function parseJsonStrict(text) {
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function summarizeHtmlText(text) {
  return String(text)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}

function parseJsonEnv(name) {
  if (!process.env[name]) return {};
  try {
    const parsed = JSON.parse(process.env[name]);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function extractImageDataUrl(data) {
  return normalizeImageDataUrl(data);
}

function loadLocalEnv() {
  if (process.env.DCC_SKIP_DOTENV === "1") return;
  loadEnvFile(join(root, ".env"));
}

function loadEnvFile(envPath) {
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index <= 0) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function safeHost(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.host;
  } catch {
    return "";
  }
}

function stripDataUrl(value) {
  const text = String(value || "");
  const comma = text.indexOf(",");
  return comma >= 0 ? text.slice(comma + 1) : text;
}

function chooseApiSize(ratio) {
  if (ratio === "3:2") return "1536x1024";
  if (ratio === "2:3") return "1024x1536";
  return "1024x1024";
}

