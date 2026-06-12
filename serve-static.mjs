import http from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const root = process.cwd();
const port = Number(process.env.PORT || 8765);
const OPENAI_IMAGE_MODEL_DEFAULT = "gpt-image-2";
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
        custom_api_configured: Boolean(process.env.DCC_CUSTOM_API_URL),
        custom_api_host: safeHost(process.env.DCC_CUSTOM_API_URL),
        has_api_key: Boolean(process.env.OPENAI_API_KEY || process.env.DCC_CUSTOM_API_KEY)
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

    let path = decodeURIComponent(url.pathname);
    if (path === "/" || path === "/index.html") {
      res.writeHead(302, {
        "location": "/capture-canvas/index.html",
        "cache-control": "no-store"
      });
      res.end();
      return;
    }
    const file = normalize(join(root, path));
    if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) {
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
  if (provider === "custom-http") return handleCustomRender(body);
  if (provider !== "openai") {
    return {
      ok: true,
      provider: "mock-local",
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

  const form = new FormData();
  form.set("model", process.env.OPENAI_IMAGE_MODEL || OPENAI_IMAGE_MODEL_DEFAULT);
  form.set("prompt", prompt || "Render the selected region as a clean product scene while preserving the source structure.");
  form.set("size", chooseApiSize(body.aspectRatio));
  form.set("quality", "low");
  form.append("image[]", new Blob([Buffer.from(source, "base64")], { type: "image/png" }), "source.png");
  form.set("mask", new Blob([Buffer.from(mask, "base64")], { type: "image/png" }), "mask.png");

  const openAiBase = String(process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
  const response = await fetch(`${openAiBase}/images/edits`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: form
  });

  const data = await response.json();
  if (!response.ok) {
    return {
      ok: false,
      provider: "openai",
      cn: "API \u9519\u8bef",
      en: "API Error",
      message_cn: data.error?.message || "OpenAI API \u8bf7\u6c42\u5931\u8d25\u3002",
      message_en: data.error?.message || "OpenAI API request failed."
    };
  }

  const b64 = data.data?.[0]?.b64_json;
  return {
    ok: Boolean(b64),
    provider: "openai",
    imageDataUrl: b64 ? `data:image/png;base64,${b64}` : "",
    cn: b64 ? "API \u8f93\u51fa" : "\u6ca1\u6709\u56fe\u50cf",
    en: b64 ? "API Output" : "No Image",
    message_cn: b64 ? "API \u5df2\u8fd4\u56de\u56fe\u50cf\u3002" : "API \u6ca1\u6709\u8fd4\u56de\u56fe\u50cf\u6570\u636e\u3002",
    message_en: b64 ? "API returned an image." : "API did not return image data."
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
    }
  };
}

function saveProviderConfig(body) {
  const provider = String(body.provider || "");
  if (provider !== "openai" && provider !== "custom-http") {
    return { ok: false, message: "Unsupported provider" };
  }

  const updates = {};
  if (provider === "openai") {
    updates.OPENAI_BASE_URL = String(body.baseUrl || "https://api.openai.com/v1").trim();
    updates.OPENAI_IMAGE_MODEL = String(body.model || OPENAI_IMAGE_MODEL_DEFAULT).trim();
    if (String(body.apiKey || "").trim()) updates.OPENAI_API_KEY = String(body.apiKey).trim();
  } else {
    updates.DCC_CUSTOM_API_URL = String(body.baseUrl || "").trim();
    updates.DCC_CUSTOM_API_MODEL = String(body.model || "").trim();
    updates.DCC_CUSTOM_API_AUTH_HEADER = String(body.authHeader || "authorization").trim();
    updates.DCC_CUSTOM_API_AUTH_SCHEME = String(body.authScheme || "Bearer").trim();
    updates.DCC_CUSTOM_API_METHOD = String(body.method || "POST").trim();
    if (String(body.apiKey || "").trim()) updates.DCC_CUSTOM_API_KEY = String(body.apiKey).trim();
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
    if (value !== "") current[key] = value;
  }
  const ordered = [
    "OPENAI_BASE_URL",
    "OPENAI_API_KEY",
    "OPENAI_IMAGE_MODEL",
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
  if (requested === "custom-http") return process.env.DCC_CUSTOM_API_URL ? "custom-http" : "custom-http-missing";
  if (requested === "openai") return process.env.OPENAI_API_KEY ? "openai" : "openai-missing";
  if (process.env.DCC_CUSTOM_API_URL) return "custom-http";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "mock-local";
}

function missingOpenAiConfig() {
  return {
    ok: false,
    provider: "openai-missing",
    cn: "OpenAI \u672a\u914d\u7f6e",
    en: "OpenAI Not Configured",
    message_cn: "\u8bf7\u5728 .env \u6216\u547d\u4ee4\u884c\u8bbe\u7f6e OPENAI_API_KEY\uff0c\u7136\u540e\u91cd\u542f node serve-static.mjs\u3002",
    message_en: "Set OPENAI_API_KEY in .env or your shell, then restart node serve-static.mjs."
  };
}

function missingCustomConfig() {
  return {
    ok: false,
    provider: "custom-http-missing",
    cn: "\u81ea\u5b9a\u4e49 API \u672a\u914d\u7f6e",
    en: "Custom API Not Configured",
    message_cn: "\u8bf7\u5728 .env \u8bbe\u7f6e DCC_CUSTOM_API_URL\uff0c\u53ef\u9009\u8bbe\u7f6e DCC_CUSTOM_API_KEY\uff0c\u7136\u540e\u91cd\u542f\u670d\u52a1\u3002",
    message_en: "Set DCC_CUSTOM_API_URL in .env, optionally DCC_CUSTOM_API_KEY, then restart the server."
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

  const config = providerConfigFromRequest({ provider: "custom-http" }).custom;
  const response = await callCustomEndpoint({
    config,
    payload: customRequestPayload(body)
  });

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

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
  return {
    ok: true,
    provider: "custom-http",
    imageDataUrl,
    cn: imageDataUrl ? "\u81ea\u5b9a\u4e49 API \u8f93\u51fa" : "\u81ea\u5b9a\u4e49 API \u5df2\u54cd\u5e94",
    en: imageDataUrl ? "Custom API Output" : "Custom API Response",
    message_cn: data.message_cn || data.message || "\u5ba2\u6237 API \u5df2\u8fd4\u56de\u3002",
    message_en: data.message_en || data.message || "Customer API returned a response."
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
    }
  };
}

function normalizeBaseUrl(value) {
  return String(value || "https://api.openai.com/v1").replace(/\/+$/, "");
}

function customRequestPayload(body, isTest = false) {
  return {
    schema_version: body.schema_version,
    session_id: body.session_id,
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

function summarizeResponse(text) {
  if (!text) return "";
  try {
    const data = JSON.parse(text);
    return data.error?.message || data.message || JSON.stringify(data).slice(0, 240);
  } catch {
    return String(text).slice(0, 240);
  }
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
  const value = data.imageDataUrl || data.image_data_url || data.output_image || data.image_url || data.url;
  if (typeof value === "string" && value.startsWith("data:image/")) return value;
  const b64 = data.b64_json || data.image_base64 || data.data?.[0]?.b64_json;
  return b64 ? `data:image/png;base64,${b64}` : "";
}

function loadLocalEnv() {
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
  if (ratio === "16:9") return "1536x1024";
  if (ratio === "4:5") return "1024x1536";
  return "1024x1024";
}

