import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { connect as netConnect } from "node:net";

const port = Number(process.env.DCC_CANVAS_TEST_PORT || 9300 + Math.floor(Math.random() * 400));
const targetUrl = process.env.DCC_CANVAS_TEST_URL || "http://127.0.0.1:8765/capture-canvas/index.html";
const chromeCandidates = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean);

const chromePath = chromeCandidates.find((item) => existsSync(item));
if (!chromePath) {
  console.log(JSON.stringify({ browser_smoke_skipped: true, reason: "chrome-not-found" }));
  process.exit(0);
}

const profileRoot = process.env.DCC_CHROME_PROFILE_ROOT || join(process.cwd(), ".tmp");
mkdirSync(profileRoot, { recursive: true });
const profile = mkdtempSync(join(profileRoot, "dcc-canvas-chrome-"));
let chromeStderr = "";
const chrome = spawn(chromePath, [
  "--headless=new",
  "--disable-gpu",
  "--disable-dev-shm-usage",
  "--disable-extensions",
  "--disable-background-networking",
  "--disable-gpu-shader-disk-cache",
  "--disable-features=DawnGraphite,SkiaGraphite",
  "--no-first-run",
  "--remote-allow-origins=*",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  "--window-size=1600,900",
  "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });

chrome.stderr?.on("data", (chunk) => {
  chromeStderr += chunk.toString();
});

async function waitForJson(url, timeout = 8000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) return await response.json();
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 160));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function waitForAnyJson(urls, timeout = 8000) {
  const started = Date.now();
  let lastError;
  while (Date.now() - started < timeout) {
    for (const url of urls) {
      try {
        const response = await fetch(url);
        if (response.ok) return await response.json();
      } catch (error) {
        lastError = error;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 160));
  }
  throw new Error(`Timed out waiting for DevTools JSON endpoint: ${lastError?.message || "no response"}`);
}

function connect(wsUrl) {
  const url = new URL(wsUrl);
  const socket = netConnect(Number(url.port), url.hostname);
  let id = 0;
  let buffer = Buffer.alloc(0);
  let handshaken = false;
  const pending = new Map();
  const rejectPending = (error) => {
    for (const task of pending.values()) {
      clearTimeout(task.timer);
      task.reject(error);
    }
    pending.clear();
  };

  const chromeErrorTail = () => chromeStderr.trim().slice(-1200);

  function sendFrame(text, opcode = 1) {
    const payload = Buffer.from(text);
    const mask = randomBytes(4);
    const lengthBytes = payload.length < 126
      ? Buffer.from([0x80 | opcode, 0x80 | payload.length])
      : Buffer.from([0x80 | opcode, 0x80 | 126, payload.length >> 8, payload.length & 255]);
    const masked = Buffer.alloc(payload.length);
    for (let i = 0; i < payload.length; i += 1) masked[i] = payload[i] ^ mask[i % 4];
    socket.write(Buffer.concat([lengthBytes, mask, masked]));
  }

  function handleMessage(data) {
    try {
      const payload = JSON.parse(data);
      const task = pending.get(payload.id);
      if (!task) return;
      pending.delete(payload.id);
      clearTimeout(task.timer);
      if (payload.error) task.reject(new Error(`${payload.error.message} ${chromeErrorTail()}`.trim()));
      else task.resolve(payload.result);
    } catch (error) {
      rejectPending(error);
    }
  }

  function readFrames() {
    while (buffer.length >= 2) {
      const opcode = buffer[0] & 0x0f;
      let length = buffer[1] & 0x7f;
      let offset = 2;
      if (length === 126) {
        if (buffer.length < 4) return;
        length = buffer.readUInt16BE(2);
        offset = 4;
      } else if (length === 127) {
        if (buffer.length < 10) return;
        length = Number(buffer.readBigUInt64BE(2));
        offset = 10;
      }
      if (buffer.length < offset + length) return;
      const payload = buffer.subarray(offset, offset + length);
      buffer = buffer.subarray(offset + length);
      if (opcode === 1) handleMessage(payload.toString("utf8"));
      else if (opcode === 8) rejectPending(new Error(`CDP websocket closed ${chromeErrorTail()}`.trim()));
      else if (opcode === 9) sendFrame(payload.toString("utf8"), 0x0a);
    }
  }

  return new Promise((resolve, reject) => {
    socket.on("connect", () => {
      const key = randomBytes(16).toString("base64");
      socket.write([
        `GET ${url.pathname}${url.search} HTTP/1.1`,
        `Host: ${url.host}`,
        "Upgrade: websocket",
        "Connection: Upgrade",
        `Sec-WebSocket-Key: ${key}`,
        "Sec-WebSocket-Version: 13",
        "",
        "",
      ].join("\r\n"));
    });

    socket.on("data", (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      if (!handshaken) {
        const headerEnd = buffer.indexOf("\r\n\r\n");
        if (headerEnd < 0) return;
        const header = buffer.subarray(0, headerEnd).toString("utf8");
        if (!header.includes(" 101 ")) {
          reject(new Error(`CDP websocket handshake failed: ${header}`));
          socket.destroy();
          return;
        }
        handshaken = true;
        buffer = buffer.subarray(headerEnd + 4);
        resolve({
          send(method, params = {}) {
            const messageId = ++id;
            const sessionId = params.__sessionId;
            if (sessionId) delete params.__sessionId;
            return new Promise((taskResolve, taskReject) => {
              const timer = setTimeout(() => {
                pending.delete(messageId);
                taskReject(new Error(`Timed out waiting for CDP response: ${method} ${chromeErrorTail()}`.trim()));
              }, 20000);
              pending.set(messageId, { resolve: taskResolve, reject: taskReject, timer });
              sendFrame(JSON.stringify({ id: messageId, method, params, ...(sessionId ? { sessionId } : {}) }));
            });
          },
          close() {
            socket.end();
          },
        });
      }
      readFrames();
    });

    socket.on("close", () => rejectPending(new Error(`CDP websocket closed ${chromeErrorTail()}`.trim())));
    socket.on("error", () => {
      const error = new Error(`CDP websocket failed ${chromeErrorTail()}`.trim());
      rejectPending(error);
      reject(error);
    });
  });
}

async function evaluate(client, expression, sessionId) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
    ...(sessionId ? { __sessionId: sessionId } : {}),
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "Runtime.evaluate failed");
  return result.result.value;
}

async function evaluateWithRetry(client, expression, sessionId, attempts = 5) {
  let lastError;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await evaluate(client, expression, sessionId);
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw lastError;
}

function isChromeEnvironmentFailure(error) {
  const message = `${error?.message || error || ""}\n${chromeStderr}`;
  return /Target crashed|GPU process isn't usable|Timed out waiting for CDP response|Error loading about:blank page took too long|GPUPersistentCache/i.test(message);
}

try {
  const version = await waitForAnyJson([`http://127.0.0.1:${port}/json/version`, `http://localhost:${port}/json/version`]);
  if (!version?.webSocketDebuggerUrl) {
    throw new Error(`Chrome did not expose a browser websocket: ${JSON.stringify(version)} ${chromeStderr}`.trim());
  }
  const client = await connect(version.webSocketDebuggerUrl);
  const created = await client.send("Target.createTarget", { url: targetUrl });
  const attached = await client.send("Target.attachToTarget", { targetId: created.targetId, flatten: true });
  const sessionId = attached.sessionId;
  await new Promise((resolve) => setTimeout(resolve, 1500));
  await evaluateWithRetry(client, `new Promise((resolve) => {
    const started = Date.now();
    const tick = () => {
      if (window.__DCC_CAPTURE_READY) resolve(true);
      else if (Date.now() - started > 8000) resolve(false);
      else setTimeout(tick, 160);
    };
    tick();
  })`, sessionId);

  const report = await evaluateWithRetry(client, `new Promise(async (resolve) => {
    const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
    const hasDarkPlaceholderText = () => {
      const canvas = document.querySelector("#sourceCanvas");
      const context = canvas.getContext("2d");
      const width = canvas.width;
      const height = canvas.height;
      const sample = context.getImageData(0, Math.max(0, Math.floor(height / 2) - 48), Math.min(width, 360), 96).data;
      let darkPixels = 0;
      for (let index = 0; index < sample.length; index += 4) {
        if (sample[index] < 80 && sample[index + 1] < 90 && sample[index + 2] < 105 && sample[index + 3] > 200) {
          darkPixels += 1;
        }
      }
      return darkPixels > 20;
    };
    const eventAt = (type, x, y, button = 0) => new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: 1,
      pointerType: "mouse",
      clientX: x,
      clientY: y,
      button,
      buttons: type === "pointerup" ? 0 : 1,
    });
    const click = (selector) => document.querySelector(selector)?.click();
    const emptyOverlayVisible = getComputedStyle(document.querySelector("#sourceEmpty")).display !== "none";
    const emptyCanvasHasDuplicateText = emptyOverlayVisible && hasDarkPlaceholderText();
    click("#exampleNav");
    await sleep(500);
    click("#rectTool");
    const canvas = document.querySelector("#sourceCanvas");
    const rect = canvas.getBoundingClientRect();
    canvas.dispatchEvent(eventAt("pointerdown", rect.left + 300, rect.top + 220));
    canvas.dispatchEvent(eventAt("pointermove", rect.left + 470, rect.top + 350));
    canvas.dispatchEvent(eventAt("pointerup", rect.left + 470, rect.top + 350));
    await sleep(80);
    click("#selectTool");
    canvas.dispatchEvent(eventAt("pointermove", rect.left + 380, rect.top + 290));
    canvas.dispatchEvent(eventAt("pointerdown", rect.left + 380, rect.top + 290));
    canvas.dispatchEvent(eventAt("pointermove", rect.left + 430, rect.top + 320));
    canvas.dispatchEvent(eventAt("pointerup", rect.left + 430, rect.top + 320));
    await sleep(80);
    canvas.dispatchEvent(new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX: rect.left + 430,
      clientY: rect.top + 320,
      button: 2,
    }));
    await sleep(80);
    const menuOpen = document.querySelector("#layerMenu")?.classList.contains("open");
    const layerMenuText = document.querySelector("#layerMenu")?.textContent || "";
    click('[data-layer-action="duplicate"]');
    await sleep(80);
    resolve({
      ready: window.__DCC_CAPTURE_READY === true,
      title: document.title,
      hasSourceCanvas: !!canvas,
      emptyCanvasHasDuplicateText,
      menuOpen,
      layerMenuHasMojibake: /[\u923b\u9204\u9231\u731d]/.test(layerMenuText),
      statusTitle: document.querySelector("#statusTitle")?.textContent || "",
      statusText: document.querySelector("#statusText")?.textContent || "",
      promptVisible: !!document.querySelector("#prompt"),
      toolbarVisible: !!document.querySelector(".floating"),
    });
  })`, sessionId);

  client.close();
  if (!report.ready || !report.hasSourceCanvas || report.emptyCanvasHasDuplicateText || !report.promptVisible || !report.toolbarVisible || !report.menuOpen || report.layerMenuHasMojibake) {
    throw new Error(`Browser smoke failed: ${JSON.stringify(report)}`);
  }
  console.log(JSON.stringify({ browser_smoke_ok: true, report }));
} catch (error) {
  if (!isChromeEnvironmentFailure(error)) throw error;
  console.log(JSON.stringify({
    browser_smoke_skipped: true,
    reason: "chrome-cdp-environment",
    detail: String(error?.message || error).slice(0, 500),
  }));
} finally {
  chrome.kill();
  await new Promise((resolve) => setTimeout(resolve, 500));
  try {
    rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 250 });
  } catch {}
}
