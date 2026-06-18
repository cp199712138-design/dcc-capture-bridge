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
    const rectsOverlap = (a, b) => Boolean(a && b && !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom));
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
    const countCyanMaskPixels = (canvas, x, y, size = 80) => {
      const context = canvas.getContext("2d");
      const left = Math.max(0, Math.floor(x - size / 2));
      const top = Math.max(0, Math.floor(y - size / 2));
      const width = Math.min(size, canvas.width, Math.floor(canvas.clientWidth - left));
      const height = Math.min(size, canvas.height, Math.floor(canvas.clientHeight - top));
      const sample = context.getImageData(left, top, Math.max(1, width), Math.max(1, height)).data;
      let pixels = 0;
      for (let index = 0; index < sample.length; index += 4) {
        const red = sample[index];
        const green = sample[index + 1];
        const blue = sample[index + 2];
        const alpha = sample[index + 3];
        if (alpha > 220 && green > red + 35 && green > blue + 8 && blue > red + 12) pixels += 1;
      }
      return pixels;
    };
    const countDarkPixelsInArea = (canvas, left, top, width, height) => {
      const context = canvas.getContext("2d");
      const x = Math.max(0, Math.floor(left));
      const y = Math.max(0, Math.floor(top));
      const w = Math.max(1, Math.min(Math.floor(width), canvas.width - x));
      const h = Math.max(1, Math.min(Math.floor(height), canvas.height - y));
      const sample = context.getImageData(x, y, w, h).data;
      let pixels = 0;
      for (let index = 0; index < sample.length; index += 4) {
        const red = sample[index];
        const green = sample[index + 1];
        const blue = sample[index + 2];
        const alpha = sample[index + 3];
        if (alpha > 220 && red < 45 && green < 55 && blue < 60) pixels += 1;
      }
      return pixels;
    };
    const countMockPreviewTintPixels = (canvas) => {
      const context = canvas.getContext("2d");
      const sample = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let pixels = 0;
      for (let index = 0; index < sample.length; index += 16) {
        const red = sample[index];
        const green = sample[index + 1];
        const blue = sample[index + 2];
        const alpha = sample[index + 3];
        if (alpha > 220 && green > red + 25 && green > blue + 4 && blue > red + 8) pixels += 1;
      }
      return pixels;
    };
    const countDarkSelectionPixelsAround = (canvas, bounds) => (
      countDarkPixelsInArea(canvas, bounds.x - 2, bounds.y - 2, bounds.w + 4, 7)
      + countDarkPixelsInArea(canvas, bounds.x - 2, bounds.y + bounds.h - 5, bounds.w + 4, 7)
      + countDarkPixelsInArea(canvas, bounds.x - 2, bounds.y - 2, 7, bounds.h + 4)
      + countDarkPixelsInArea(canvas, bounds.x + bounds.w - 5, bounds.y - 2, 7, bounds.h + 4)
    );
    const toolActiveStateIsConsistent = (tool) => {
      const buttons = [...document.querySelectorAll("[data-tool]")];
      const expected = buttons.filter((button) => button.dataset.tool === tool);
      return expected.length > 0
        && expected.every((button) => button.classList.contains("active"))
        && buttons.every((button) => (button.dataset.tool === tool) === button.classList.contains("active"));
    };
    const hasCyanAt = (canvas, x, y) => countCyanMaskPixels(canvas, x, y, 32) > 40;
    const click = (selector) => document.querySelector(selector)?.click();
    const setFileInput = (input, file) => {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    };
    const waitFor = async (predicate, timeout = 2000) => {
      const started = Date.now();
      while (Date.now() - started < timeout) {
        if (predicate()) return true;
        await sleep(80);
      }
      return false;
    };
    const emptyOverlayVisible = getComputedStyle(document.querySelector("#sourceEmpty")).display !== "none";
    const emptyCanvasHasDuplicateText = emptyOverlayVisible && hasDarkPlaceholderText();
    if (document.querySelector("#liveChip")?.classList.contains("active")) click("#liveChip");
    click("#exampleNav");
    await sleep(500);
    const canvas = document.querySelector("#sourceCanvas");
    const rect = canvas.getBoundingClientRect();
    click("#brushBtn");
    const brushToolActiveConsistent = toolActiveStateIsConsistent("brush");
    const tapPoint = { x: rect.left + 610, y: rect.top + 260 };
    canvas.dispatchEvent(eventAt("pointerdown", tapPoint.x, tapPoint.y));
    canvas.dispatchEvent(eventAt("pointerup", tapPoint.x, tapPoint.y));
    await sleep(120);
    const brushClickMaskPixels = countCyanMaskPixels(canvas, tapPoint.x - rect.left, tapPoint.y - rect.top);
    const brushSize = Number(document.querySelector("#brushSize")?.value || 44);
    const brushPad = Math.max(10, brushSize / 2);
    const brushClickBounds = {
      x: tapPoint.x - rect.left - brushPad,
      y: tapPoint.y - rect.top - brushPad,
      w: brushPad * 2,
      h: brushPad * 2,
    };
    const brushModeSelectionDarkPixels = countDarkSelectionPixelsAround(canvas, brushClickBounds);
    const pausedAutoStateAfterBrush = document.querySelector("#requestState")?.dataset.state || "";
    click("#rectTool");
    canvas.dispatchEvent(eventAt("pointerdown", rect.left + 300, rect.top + 220));
    canvas.dispatchEvent(eventAt("pointermove", rect.left + 470, rect.top + 350));
    canvas.dispatchEvent(eventAt("pointerup", rect.left + 470, rect.top + 350));
    await sleep(80);
    const rectModeSelectionDarkPixels = countDarkSelectionPixelsAround(canvas, { x: 300, y: 220, w: 170, h: 130 });
    const pausedAutoStateAfterRect = document.querySelector("#requestState")?.dataset.state || "";
    click("#selectTool");
    const selectToolActiveConsistent = toolActiveStateIsConsistent("select");
    canvas.dispatchEvent(eventAt("pointermove", rect.left + 380, rect.top + 290));
    canvas.dispatchEvent(eventAt("pointerdown", rect.left + 380, rect.top + 290));
    await sleep(80);
    const selectModeSelectionDarkPixels = countDarkSelectionPixelsAround(canvas, { x: 300, y: 220, w: 170, h: 130 });
    canvas.dispatchEvent(eventAt("pointermove", rect.left + 430, rect.top + 320));
    canvas.dispatchEvent(eventAt("pointerup", rect.left + 430, rect.top + 320));
    await sleep(80);
    const movedRectNewPixelCount = countCyanMaskPixels(canvas, 500, 365, 32);
    const movedRectHasNewPixels = movedRectNewPixelCount > 40;
    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "z", ctrlKey: true }));
    await sleep(80);
    const undoOriginalPixelCount = countCyanMaskPixels(canvas, 315, 235, 32);
    const undoMovedPixelCount = countCyanMaskPixels(canvas, 500, 365, 32);
    const undoMoveRestoresOriginalPixels = undoOriginalPixelCount > 40 && undoMovedPixelCount <= 40;
    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "y", ctrlKey: true }));
    await sleep(80);
    const redoMovedPixelCount = countCyanMaskPixels(canvas, 500, 365, 32);
    const redoOriginalPixelCount = countCyanMaskPixels(canvas, 315, 235, 32);
    const redoMoveRestoresMovedPixels = redoMovedPixelCount > 40 && redoOriginalPixelCount <= 40;
    canvas.dispatchEvent(new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX: rect.left + 80,
      clientY: rect.top + 80,
      button: 2,
    }));
    await sleep(80);
    const emptyRightClickMenuOpen = document.querySelector("#layerMenu")?.classList.contains("open");
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
    const promptRect = document.querySelector(".prompt")?.getBoundingClientRect();
    const toolbarRect = document.querySelector(".floating")?.getBoundingClientRect();
    click('[data-layer-action="duplicate"]');
    await sleep(80);
    const modelInput = document.querySelector("#modelInput");
    const objSource = [
      "v 0 0 0",
      "v 1 0 0",
      "v 0 1 0",
      "v 0 0 1",
      "f 1 2 3",
      "f 1 2 4",
      "f 1 3 4",
      "f 2 3 4",
    ].join("\\n");
    setFileInput(modelInput, new File([objSource], "smoke-tetra.obj", { type: "text/plain" }));
    await waitFor(() => /smoke-tetra\\.obj/.test(document.querySelector("#assetInfo")?.textContent || ""));
    const modelAssetText = document.querySelector("#assetInfo")?.textContent || "";
    const modelImported = /smoke-tetra\\.obj/.test(modelAssetText)
      && /4\\s*(triangles|三角面)/i.test(modelAssetText);
    click("#brushBtn");
    await sleep(120);
    const brushModeModelBeforeWheel = canvas.toDataURL("image/png");
    canvas.dispatchEvent(new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      clientX: rect.left + 420,
      clientY: rect.top + 300,
      deltaY: -520,
    }));
    await sleep(160);
    const brushModeWheelIgnoredForModel = brushModeModelBeforeWheel === canvas.toDataURL("image/png");
    click("#selectTool");
    await sleep(120);
    const selectModeModelBeforeWheel = canvas.toDataURL("image/png");
    canvas.dispatchEvent(new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      clientX: rect.left + 420,
      clientY: rect.top + 300,
      deltaY: -520,
    }));
    await sleep(160);
    const selectModeWheelZoomsModel = selectModeModelBeforeWheel !== canvas.toDataURL("image/png");
    click("#previewBtn");
    await sleep(220);
    const modelPreviewQueuedOrRendered = ["queued", "busy", "local", "api"].includes(document.querySelector("#requestState")?.dataset.state || "");
    const mockPreviewUsesLocalState = document.querySelector("#apiState")?.dataset.state === "local"
      && document.querySelector("#outputBadge")?.textContent !== "API 输出"
      && document.querySelector("#outputBadge")?.textContent !== "API output";
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const url = String(input?.url || input || "");
      if (url.includes("/api/realtime-render")) {
        return new Response(JSON.stringify({
          ok: false,
          provider: "openai",
          imageDataUrl: "",
          message_cn: "OpenAI 测试错误",
          message_en: "OpenAI test error",
        }), { status: 200, headers: { "content-type": "application/json" } });
      }
      return originalFetch(input, init);
    };
    const providerSelect = document.querySelector("#providerSelect");
    providerSelect.value = "openai";
    providerSelect.dispatchEvent(new Event("change", { bubbles: true }));
    click("#previewBtn");
    await waitFor(() => document.querySelector("#requestState")?.dataset.state === "error");
    const apiErrorBadgeAvoidsSuccess = document.querySelector("#outputBadge")?.textContent !== "API 输出"
      && document.querySelector("#outputBadge")?.textContent !== "API output";
    const apiErrorBadgeShowsFailure = /API 错误|API error/.test(document.querySelector("#outputBadge")?.textContent || "");
    const apiErrorTextVisible = /OpenAI 测试错误|OpenAI test error|API 错误|API error/.test([
      document.querySelector("#statusTitle")?.textContent || "",
      document.querySelector("#statusText")?.textContent || "",
    ].join(" "));
    const apiErrorClearsMockPreview = countMockPreviewTintPixels(document.querySelector("#resultCanvas")) < 500;
    window.fetch = originalFetch;
    setFileInput(modelInput, new File(["v 0 0 0\\n"], "broken.obj", { type: "text/plain" }));
    await waitFor(() => /No renderable triangles|没有/.test(document.querySelector("#statusText")?.textContent || ""));
    const modelImportFailureHasFeedback = /No renderable triangles|没有/.test(document.querySelector("#statusText")?.textContent || "");
    resolve({
      ready: window.__DCC_CAPTURE_READY === true,
      title: document.title,
      hasSourceCanvas: !!canvas,
      emptyCanvasHasDuplicateText,
      brushClickMaskPixels,
      brushModeSelectionDarkPixels,
      rectModeSelectionDarkPixels,
      selectModeSelectionDarkPixels,
      brushToolActiveConsistent,
      selectToolActiveConsistent,
      pausedLiveAvoidsAutoQueue: !["queued", "busy"].includes(pausedAutoStateAfterBrush) && !["queued", "busy"].includes(pausedAutoStateAfterRect),
      movedRectHasNewPixels,
      movedRectNewPixelCount,
      undoMoveRestoresOriginalPixels,
      undoOriginalPixelCount,
      undoMovedPixelCount,
      redoMoveRestoresMovedPixels,
      redoMovedPixelCount,
      redoOriginalPixelCount,
      emptyRightClickMenuOpen,
      menuOpen,
      layerMenuHasMojibake: /[\u923b\u9204\u9231\u731d]/.test(layerMenuText),
      statusTitle: document.querySelector("#statusTitle")?.textContent || "",
      statusText: document.querySelector("#statusText")?.textContent || "",
      promptVisible: !!document.querySelector("#prompt"),
      toolbarVisible: !!document.querySelector(".floating"),
      promptToolbarOverlap: rectsOverlap(promptRect, toolbarRect),
      modelImported,
      modelAssetText,
      brushModeWheelIgnoredForModel,
      selectModeWheelZoomsModel,
      modelPreviewQueuedOrRendered,
      mockPreviewUsesLocalState,
      apiErrorBadgeAvoidsSuccess,
      apiErrorBadgeShowsFailure,
      apiErrorTextVisible,
      apiErrorClearsMockPreview,
      modelImportFailureHasFeedback,
    });
  })`, sessionId);

  client.close();
  if (!report.ready || !report.hasSourceCanvas || report.emptyCanvasHasDuplicateText || report.brushClickMaskPixels < 8 || report.brushModeSelectionDarkPixels > 16 || report.rectModeSelectionDarkPixels > 160 || report.selectModeSelectionDarkPixels < 24 || report.selectModeSelectionDarkPixels <= report.rectModeSelectionDarkPixels * 2 || !report.brushToolActiveConsistent || !report.selectToolActiveConsistent || !report.pausedLiveAvoidsAutoQueue || !report.movedRectHasNewPixels || !report.undoMoveRestoresOriginalPixels || !report.redoMoveRestoresMovedPixels || report.emptyRightClickMenuOpen || !report.promptVisible || !report.toolbarVisible || !report.menuOpen || report.layerMenuHasMojibake || report.promptToolbarOverlap || !report.modelImported || !report.brushModeWheelIgnoredForModel || !report.selectModeWheelZoomsModel || !report.modelPreviewQueuedOrRendered || !report.mockPreviewUsesLocalState || !report.apiErrorBadgeAvoidsSuccess || !report.apiErrorBadgeShowsFailure || !report.apiErrorTextVisible || !report.apiErrorClearsMockPreview || !report.modelImportFailureHasFeedback) {
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
