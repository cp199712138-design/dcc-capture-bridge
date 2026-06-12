import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const port = Number(process.env.DCC_CANVAS_TEST_PORT || 9224);
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

const profile = mkdtempSync(join(tmpdir(), "dcc-canvas-chrome-"));
const chrome = spawn(chromePath, [
  "--headless=new",
  "--disable-gpu",
  "--disable-extensions",
  "--no-first-run",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  "--window-size=1600,900",
  "about:blank",
], { stdio: "ignore" });

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

function connect(wsUrl) {
  const socket = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const payload = JSON.parse(event.data);
    const task = pending.get(payload.id);
    if (!task) return;
    pending.delete(payload.id);
    if (payload.error) task.reject(new Error(payload.error.message));
    else task.resolve(payload.result);
  });
  return new Promise((resolve, reject) => {
    socket.addEventListener("open", () => {
      resolve({
        send(method, params = {}) {
          const messageId = ++id;
          socket.send(JSON.stringify({ id: messageId, method, params }));
          return new Promise((taskResolve, taskReject) => {
            pending.set(messageId, { resolve: taskResolve, reject: taskReject });
          });
        },
        close() {
          socket.close();
        },
      });
    });
    socket.addEventListener("error", () => reject(new Error("CDP websocket failed")));
  });
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "Runtime.evaluate failed");
  return result.result.value;
}

async function evaluateWithRetry(client, expression, attempts = 5) {
  let lastError;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await evaluate(client, expression);
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw lastError;
}

try {
  await waitForJson(`http://127.0.0.1:${port}/json/version`);
  const target = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(targetUrl)}`, { method: "PUT" }).then((response) => response.json());
  const client = await connect(target.webSocketDebuggerUrl);
  await client.send("Runtime.enable");
  await client.send("Page.enable");
  await new Promise((resolve) => setTimeout(resolve, 1500));
  await evaluateWithRetry(client, `new Promise((resolve) => {
    const started = Date.now();
    const tick = () => {
      if (window.__DCC_CAPTURE_READY) resolve(true);
      else if (Date.now() - started > 8000) resolve(false);
      else setTimeout(tick, 160);
    };
    tick();
  })`);

  const report = await evaluateWithRetry(client, `new Promise(async (resolve) => {
    const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
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
    click('[data-layer-action="duplicate"]');
    await sleep(80);
    resolve({
      title: document.title,
      hasSourceCanvas: !!canvas,
      menuOpen,
      statusTitle: document.querySelector("#statusTitle")?.textContent || "",
      statusText: document.querySelector("#statusText")?.textContent || "",
      promptVisible: !!document.querySelector("#prompt"),
      toolbarVisible: !!document.querySelector(".floating"),
    });
  })`);

  client.close();
  if (!report.hasSourceCanvas || !report.promptVisible || !report.toolbarVisible || !report.menuOpen) {
    throw new Error(`Browser smoke failed: ${JSON.stringify(report)}`);
  }
  console.log(JSON.stringify({ browser_smoke_ok: true, report }));
} finally {
  chrome.kill();
  await new Promise((resolve) => setTimeout(resolve, 500));
  try {
    rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 250 });
  } catch {}
}
