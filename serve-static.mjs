import http from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const root = process.cwd();
const port = 8765;
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
        has_api_key: Boolean(process.env.OPENAI_API_KEY || process.env.DCC_CUSTOM_API_KEY),
        has_custom_api: Boolean(process.env.DCC_CUSTOM_API_URL),
        custom_api_configured: Boolean(process.env.DCC_CUSTOM_API_URL)
      });
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
  console.log(`DCC Capture Canvas http://127.0.0.1:${port}/capture-canvas/index.html`);
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
  form.set("model", process.env.OPENAI_IMAGE_MODEL || "gpt-image-1.5");
  form.set("prompt", prompt || "Render the selected region as a clean product scene while preserving the source structure.");
  form.set("size", chooseApiSize(body.aspectRatio));
  form.set("image", new Blob([Buffer.from(source, "base64")], { type: "image/png" }), "source.png");
  form.set("mask", new Blob([Buffer.from(mask, "base64")], { type: "image/png" }), "mask.png");

  const response = await fetch("https://api.openai.com/v1/images/edits", {
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

function chooseRuntimeProvider(body) {
  const requested = String(body.provider || "auto");
  if (requested === "mock-local") return "mock-local";
  if (requested === "custom-http") return process.env.DCC_CUSTOM_API_URL ? "custom-http" : "mock-local";
  if (requested === "openai") return process.env.OPENAI_API_KEY ? "openai" : "mock-local";
  if (process.env.DCC_CUSTOM_API_URL) return "custom-http";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "mock-local";
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

  const headers = {
    "content-type": "application/json",
    ...parseJsonEnv("DCC_CUSTOM_API_HEADERS")
  };
  if (process.env.DCC_CUSTOM_API_KEY) {
    const authHeader = process.env.DCC_CUSTOM_API_AUTH_HEADER || "authorization";
    const authScheme = process.env.DCC_CUSTOM_API_AUTH_SCHEME || "Bearer";
    headers[authHeader] = authScheme ? `${authScheme} ${process.env.DCC_CUSTOM_API_KEY}` : process.env.DCC_CUSTOM_API_KEY;
  }

  const response = await fetch(process.env.DCC_CUSTOM_API_URL, {
    method: process.env.DCC_CUSTOM_API_METHOD || "POST",
    headers,
    body: JSON.stringify({
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
      reason: body.reason || "preview"
    })
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
