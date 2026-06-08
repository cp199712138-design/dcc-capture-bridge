import { buildGenerationRequest, createSessionState, registerAsset } from "./capture-core.mjs";

const state = {
  lang: "cn",
  tool: "brush",
  mode: "draw",
  aspectRatio: "1:1",
  seed: 1284,
  image: null,
  model: null,
  generatedImage: null,
  session: createSessionState(),
  strokes: [],
  drawing: false,
  draft: null,
  liveEnabled: true,
  renderTimer: 0,
  renderSeq: 0,
  renderController: null,
  lastRequest: null,
  raf: 0
};

const board = document.getElementById("board");
const sourceCanvas = document.getElementById("sourceCanvas");
const resultCanvas = document.getElementById("resultCanvas");
const sctx = sourceCanvas.getContext("2d");
const rctx = resultCanvas.getContext("2d");
const maskCanvas = document.createElement("canvas");
const maskCtx = maskCanvas.getContext("2d");
const fxCanvas = document.createElement("canvas");
const fxCtx = fxCanvas.getContext("2d");

const sourceEmpty = document.getElementById("sourceEmpty");
const assetInfo = document.getElementById("assetInfo");
const statusTitle = document.getElementById("statusTitle");
const statusText = document.getElementById("statusText");
const apiState = document.getElementById("apiState");
const outputBadge = document.getElementById("outputBadge");
const imageInput = document.getElementById("imageInput");
const modelInput = document.getElementById("modelInput");
const promptBox = document.getElementById("prompt");
const brushSize = document.getElementById("brushSize");
const strength = document.getElementById("strength");
const brushSizeDock = document.getElementById("brushSizeDock");
const strengthDock = document.getElementById("strengthDock");
const brushCursor = document.getElementById("brushCursor");
const toolModeText = document.getElementById("toolModeText");
const brushSizeText = document.getElementById("brushSizeText");
const drawModeChip = document.getElementById("drawModeChip");
const aspectRatioChip = document.getElementById("aspectRatioChip");
const seedChip = document.getElementById("seedChip");
const liveChip = document.getElementById("liveChip");

const toolNames = {
  select: ["选择", "Select"],
  brush: ["画笔", "Brush"],
  erase: ["橡皮擦", "Eraser"],
  rect: ["矩形选区", "Rectangle Region"],
  circle: ["圆形选区", "Circle Region"]
};

function t(cn, en) {
  return state.lang === "cn" ? cn : en;
}

function setStatus(cnTitle, enTitle, cnText, enText) {
  statusTitle.textContent = t(cnTitle, enTitle);
  statusText.textContent = t(cnText, enText);
}

function setApiState(kind, cn, en) {
  apiState.textContent = t(cn, en);
  apiState.dataset.cn = cn;
  apiState.dataset.en = en;
  apiState.classList.toggle("busy", kind === "busy");
  apiState.classList.toggle("error", kind === "error");

  const isApi = kind === "api";
  outputBadge.textContent = t(isApi ? "API 输出" : "本地预览", isApi ? "API Output" : "Local Preview");
  outputBadge.dataset.cn = isApi ? "API 输出" : "本地预览";
  outputBadge.dataset.en = isApi ? "API Output" : "Local Preview";
}

function activeAsset() {
  return state.image || state.model;
}

function fileSize(bytes) {
  return bytes > 1048576
    ? (bytes / 1048576).toFixed(1) + " MB"
    : Math.max(1, Math.round((bytes || 0) / 1024)) + " KB";
}

function updateToolReadout() {
  const names = toolNames[state.tool] || toolNames.brush;
  toolModeText.textContent = t(names[0], names[1]);
  brushSizeText.textContent = Number(brushSize.value) + " px";
  brushCursor.style.setProperty("--brush", Number(brushSize.value) + "px");

  document.querySelectorAll("[data-tool]").forEach((node) => {
    node.classList.toggle("active", node.dataset.tool === state.tool);
  });
  brushCursor.classList.toggle("erase", state.tool === "erase");
  brushCursor.classList.toggle("shape", state.tool === "rect" || state.tool === "circle");
}

function updateRealtimeChips() {
  drawModeChip.textContent = state.mode === "draw" ? t("绘制", "Draw") : t("仅文字", "Text Only");
  drawModeChip.classList.toggle("active", state.mode === "draw");
  aspectRatioChip.textContent = state.aspectRatio;
  seedChip.textContent = t("种子 ", "Seed ") + state.seed;
  seedChip.dataset.cn = "种子 " + state.seed;
  seedChip.dataset.en = "Seed " + state.seed;
  liveChip.textContent = state.liveEnabled ? t("实时", "Live") : t("暂停", "Paused");
  liveChip.classList.toggle("active", state.liveEnabled);
}

function applyLanguage() {
  document.documentElement.lang = state.lang === "cn" ? "zh-CN" : "en";
  document.querySelectorAll("[data-cn][data-en]").forEach((node) => {
    node.textContent = state.lang === "cn" ? node.dataset.cn : node.dataset.en;
  });
  if (!promptBox.dataset.custom) {
    promptBox.value = state.lang === "cn" ? promptBox.dataset.cnValue : promptBox.dataset.enValue;
  }
  updateToolReadout();
  updateRealtimeChips();
  draw();
}

function fitVisibleCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * ratio));
  canvas.height = Math.max(1, Math.floor(rect.height * ratio));
  canvas.getContext("2d").setTransform(ratio, 0, 0, ratio, 0, 0);
}

function fitBufferCanvas(canvas, ctx, width, height) {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(width * ratio));
  canvas.height = Math.max(1, Math.floor(height * ratio));
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function fitAll() {
  fitVisibleCanvas(sourceCanvas);
  fitVisibleCanvas(resultCanvas);
  fitBufferCanvas(maskCanvas, maskCtx, sourceCanvas.clientWidth, sourceCanvas.clientHeight);
  fitBufferCanvas(fxCanvas, fxCtx, resultCanvas.clientWidth, resultCanvas.clientHeight);
  redrawMaskBitmap();
  draw();
}

function scheduleDraw() {
  if (state.raf) return;
  state.raf = requestAnimationFrame(() => {
    state.raf = 0;
    draw();
  });
}

function scheduleRealtimeRender(reason = "edit") {
  if (!state.liveEnabled || !activeAsset()) return;
  window.clearTimeout(state.renderTimer);
  state.renderTimer = window.setTimeout(() => {
    requestRealtimeRender(reason);
  }, reason === "preview" ? 0 : 780);
}

function point(e) {
  const rect = sourceCanvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function updateBrushCursor(e) {
  const boardRect = board.getBoundingClientRect();
  brushCursor.style.left = e.clientX - boardRect.left + "px";
  brushCursor.style.top = e.clientY - boardRect.top + "px";
  brushCursor.style.opacity = activeAsset() && e.target === sourceCanvas && state.tool !== "select" ? "1" : "0";
}

function roundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function imageRect(canvas, img) {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const scale = Math.min(w * 0.82 / img.width, h * 0.82 / img.height);
  const iw = img.width * scale;
  const ih = img.height * scale;
  return { x: (w - iw) / 2, y: (h - ih) / 2, w: iw, h: ih };
}

function placeholder(ctx, canvas, title, subtitle) {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  ctx.fillStyle = canvas === sourceCanvas ? "#e8e9e5" : "#dfe3e1";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#202733";
  ctx.font = "700 18px Segoe UI, Microsoft YaHei, sans-serif";
  ctx.fillText(title, 42, h / 2 - 10);
  ctx.fillStyle = "#667281";
  ctx.font = "13px Segoe UI, Microsoft YaHei, sans-serif";
  ctx.fillText(subtitle, 42, h / 2 + 18);
}

function drawModel(ctx, canvas) {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const cx = w / 2;
  const cy = h / 2;

  ctx.fillStyle = canvas === sourceCanvas ? "#e8e9e5" : "#dfe3e1";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#24324a";
  ctx.strokeStyle = "#68a5ff";
  ctx.lineWidth = 2;
  roundedRect(ctx, cx - 104, cy - 96, 208, 192, 26);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#0a111b";
  roundedRect(ctx, cx - 58, cy - 42, 116, 86, 14);
  ctx.fill();
  ctx.fillStyle = "#63e6b4";
  ctx.beginPath();
  ctx.arc(cx - 34, cy - 12, 10, 0, Math.PI * 2);
  ctx.arc(cx + 34, cy - 12, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#f3d35a";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 40, cy + 28);
  ctx.quadraticCurveTo(cx, cy + 48, cx + 40, cy + 28);
  ctx.stroke();

  ctx.fillStyle = "#202733";
  ctx.font = "700 16px Segoe UI, Microsoft YaHei, sans-serif";
  ctx.fillText(state.model.name, 42, 62);
}

function drawStrokeOnContext(ctx, stroke) {
  if (!stroke) return;
  ctx.save();
  ctx.globalCompositeOperation = stroke.mode === "erase" ? "destination-out" : "source-over";
  ctx.strokeStyle = "rgba(255,255,255,1)";
  ctx.fillStyle = "rgba(255,255,255,1)";
  ctx.lineWidth = stroke.size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (stroke.kind === "path" && stroke.points.length) {
    ctx.beginPath();
    stroke.points.forEach((item, index) => {
      if (index === 0) ctx.moveTo(item.x, item.y);
      else ctx.lineTo(item.x, item.y);
    });
    ctx.stroke();
  }

  if (stroke.kind === "rect") {
    const x = Math.min(stroke.start.x, stroke.end.x);
    const y = Math.min(stroke.start.y, stroke.end.y);
    ctx.fillRect(x, y, Math.abs(stroke.end.x - stroke.start.x), Math.abs(stroke.end.y - stroke.start.y));
  }

  if (stroke.kind === "circle") {
    const dx = stroke.end.x - stroke.start.x;
    const dy = stroke.end.y - stroke.start.y;
    ctx.beginPath();
    ctx.arc(stroke.start.x, stroke.start.y, Math.max(4, Math.sqrt(dx * dx + dy * dy)), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function redrawMaskBitmap() {
  maskCtx.clearRect(0, 0, sourceCanvas.clientWidth, sourceCanvas.clientHeight);
  state.strokes.forEach((stroke) => drawStrokeOnContext(maskCtx, stroke));
}

function drawMaskOverlay(ctx, w, h) {
  if (!state.strokes.length) return;
  fxCtx.clearRect(0, 0, w, h);
  fxCtx.fillStyle = "rgba(41,242,255,.35)";
  fxCtx.fillRect(0, 0, w, h);
  fxCtx.globalCompositeOperation = "destination-in";
  fxCtx.drawImage(maskCanvas, 0, 0, w, h);
  fxCtx.globalCompositeOperation = "source-over";
  ctx.drawImage(fxCanvas, 0, 0, w, h);
}

function drawDraft(ctx) {
  if (!state.draft) return;
  ctx.save();
  ctx.setLineDash([8, 7]);
  ctx.strokeStyle = "#061018";
  ctx.lineWidth = 2;
  if (state.draft.kind === "rect") {
    const x = Math.min(state.draft.start.x, state.draft.end.x);
    const y = Math.min(state.draft.start.y, state.draft.end.y);
    ctx.strokeRect(x, y, Math.abs(state.draft.end.x - state.draft.start.x), Math.abs(state.draft.end.y - state.draft.start.y));
  }
  if (state.draft.kind === "circle") {
    const dx = state.draft.end.x - state.draft.start.x;
    const dy = state.draft.end.y - state.draft.start.y;
    ctx.beginPath();
    ctx.arc(state.draft.start.x, state.draft.start.y, Math.max(4, Math.sqrt(dx * dx + dy * dy)), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSource() {
  const w = sourceCanvas.clientWidth;
  const h = sourceCanvas.clientHeight;
  sctx.clearRect(0, 0, w, h);

  if (state.image) {
    sctx.fillStyle = "#e8e9e5";
    sctx.fillRect(0, 0, w, h);
    const rect = imageRect(sourceCanvas, state.image);
    sctx.drawImage(state.image, rect.x, rect.y, rect.w, rect.h);
    drawMaskOverlay(sctx, w, h);
    drawDraft(sctx);
    return;
  }

  if (state.model) {
    drawModel(sctx, sourceCanvas);
    drawMaskOverlay(sctx, w, h);
    drawDraft(sctx);
    return;
  }

  placeholder(sctx, sourceCanvas, t("等待输入", "Waiting for input"), t("导入图片或模型开始。", "Import an image or model to start."));
}

function randomUnit(index) {
  const x = Math.sin((state.seed + index * 97) * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function drawPreviewEffect(ctx, w, h) {
  const amount = Number(strength.value) / 100;
  const count = Math.round(12 + amount * 46);

  ctx.fillStyle = "rgba(236,238,232,.34)";
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < count; i += 1) {
    const x = randomUnit(i + 1) * w;
    const y = h * (0.48 + randomUnit(i + 2) * 0.42);
    const radius = 12 + randomUnit(i + 3) * 36;
    ctx.fillStyle = ["#59636f", "#81796f", "#9b8a78", "#43505d", "#b8aa94"][i % 5];
    ctx.beginPath();
    ctx.ellipse(x, y, radius * 1.25, radius * 0.72, randomUnit(i + 4) * Math.PI, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.22)";
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(41,242,255,.12)";
  ctx.fillRect(0, 0, w, h);
}

function drawResult() {
  const w = resultCanvas.clientWidth;
  const h = resultCanvas.clientHeight;
  rctx.clearRect(0, 0, w, h);

  if (state.generatedImage) {
    rctx.fillStyle = "#dfe3e1";
    rctx.fillRect(0, 0, w, h);
    const rect = imageRect(resultCanvas, state.generatedImage);
    rctx.drawImage(state.generatedImage, rect.x, rect.y, rect.w, rect.h);
    return;
  }

  if (state.image) {
    rctx.fillStyle = "#dfe3e1";
    rctx.fillRect(0, 0, w, h);
    const rect = imageRect(resultCanvas, state.image);
    rctx.drawImage(state.image, rect.x, rect.y, rect.w, rect.h);
    if (state.strokes.length) {
      fxCtx.clearRect(0, 0, w, h);
      drawPreviewEffect(fxCtx, w, h);
      fxCtx.globalCompositeOperation = "destination-in";
      fxCtx.drawImage(maskCanvas, 0, 0, w, h);
      fxCtx.globalCompositeOperation = "source-over";
      rctx.drawImage(fxCanvas, 0, 0, w, h);
    }
    return;
  }

  if (state.model) {
    drawModel(rctx, resultCanvas);
    if (state.strokes.length || state.lastRequest) drawPreviewEffect(rctx, w, h);
    return;
  }

  placeholder(rctx, resultCanvas, t("实时预览", "Live Preview"), t("这里显示本地模拟输出。", "Local simulated output appears here."));
}

function draw() {
  sourceEmpty.style.display = activeAsset() ? "none" : "grid";
  drawSource();
  drawResult();
}

function resetMask() {
  state.strokes = [];
  state.draft = null;
  state.lastRequest = null;
  state.generatedImage = null;
  redrawMaskBitmap();
}

function setTool(tool) {
  state.tool = tool;
  updateToolReadout();
  const names = toolNames[tool] || toolNames.brush;
  const hint = {
    select: ["选择模式只查看画布，不绘制遮罩。", "Select mode views the canvas without painting a mask."],
    brush: ["拖动画笔添加要编辑的区域。", "Drag the brush to add the edit region."],
    erase: ["拖动橡皮擦移除多余遮罩。", "Drag the eraser to remove extra mask."],
    rect: ["拖拽画出矩形选区。", "Drag to create a rectangular region."],
    circle: ["拖拽画出圆形选区。", "Drag to create a circular region."]
  }[tool];
  setStatus(names[0], names[1], hint[0], hint[1]);
}

function sourceDataUrl() {
  const canvas = document.createElement("canvas");
  const w = Math.max(1, Math.round(sourceCanvas.clientWidth));
  const h = Math.max(1, Math.round(sourceCanvas.clientHeight));
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  if (state.image) {
    ctx.fillStyle = "#e8e9e5";
    ctx.fillRect(0, 0, w, h);
    const rect = imageRect(sourceCanvas, state.image);
    ctx.drawImage(state.image, rect.x, rect.y, rect.w, rect.h);
  } else if (state.model) {
    drawModel(ctx, { clientWidth: w, clientHeight: h });
  } else {
    ctx.fillStyle = "#e8e9e5";
    ctx.fillRect(0, 0, w, h);
  }

  return canvas.toDataURL("image/png");
}

function editMaskDataUrl() {
  const canvas = document.createElement("canvas");
  const w = Math.max(1, Math.round(sourceCanvas.clientWidth));
  const h = Math.max(1, Math.round(sourceCanvas.clientHeight));
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "rgba(0,0,0,1)";
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "destination-out";
  ctx.drawImage(maskCanvas, 0, 0, w, h);
  ctx.globalCompositeOperation = "source-over";
  return canvas.toDataURL("image/png");
}

function loadGeneratedImage(dataUrl) {
  const img = new Image();
  img.onload = () => {
    state.generatedImage = img;
    draw();
  };
  img.src = dataUrl;
}

async function requestRealtimeRender(reason) {
  if (!activeAsset()) return;
  if (!state.strokes.length && reason !== "preview" && reason !== "example") return;

  const seq = state.renderSeq + 1;
  state.renderSeq = seq;
  if (state.renderController) state.renderController.abort();
  state.renderController = new AbortController();

  state.lastRequest = buildGenerationRequest({
    state: state.session,
    prompt: promptBox.value,
    strokes: state.strokes,
    strength: Number(strength.value),
    provider: "openai-api",
    seed: state.seed,
    outputType: "image",
    mode: state.mode,
    aspectRatio: state.aspectRatio
  });

  setApiState("busy", "生成中", "Rendering");

  try {
    const response = await fetch("/api/realtime-render", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...state.lastRequest,
        reason,
        sourceImageDataUrl: sourceDataUrl(),
        maskDataUrl: editMaskDataUrl()
      }),
      signal: state.renderController.signal
    });
    const payload = await response.json();
    if (seq !== state.renderSeq) return;

    if (payload.imageDataUrl) {
      loadGeneratedImage(payload.imageDataUrl);
      setApiState("api", "API 输出", "API Output");
      setStatus("实时输出已更新", "Realtime Output Updated", "右侧画面来自 API 返回结果。", "The right canvas uses the API result.");
      return;
    }

    state.generatedImage = null;
    draw();
    setApiState(payload.provider === "openai" ? "api" : "local", payload.cn || "本地预览", payload.en || "Local Preview");
    setStatus("本地预览", "Local Preview", payload.message_cn || "未配置 API key，当前使用本地预览。", payload.message_en || "No API key configured; using local preview.");
  } catch (error) {
    if (error.name === "AbortError") return;
    state.generatedImage = null;
    draw();
    setApiState("error", "API 错误", "API Error");
    setStatus("接口错误", "API Error", String(error.message || error), String(error.message || error));
  }
}

function registerImage(file, img) {
  state.session = registerAsset(createSessionState(), {
    kind: "image",
    name: file.name,
    size: file.size,
    mime: file.type || "",
    width: img.naturalWidth || img.width,
    height: img.naturalHeight || img.height
  });
}

function loadExampleAsset() {
  const demo = document.createElement("canvas");
  demo.width = 960;
  demo.height = 640;
  const ctx = demo.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, demo.width, demo.height);
  grad.addColorStop(0, "#f4f5f0");
  grad.addColorStop(1, "#d8dedb");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, demo.width, demo.height);
  ctx.fillStyle = "rgba(40,48,58,.16)";
  ctx.beginPath();
  ctx.ellipse(480, 464, 250, 58, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#11151c";
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(270, 370);
  ctx.lineTo(330, 270);
  ctx.lineTo(520, 282);
  ctx.lineTo(620, 360);
  ctx.lineTo(570, 404);
  ctx.lineTo(395, 382);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(332, 270);
  ctx.quadraticCurveTo(435, 220, 548, 280);
  ctx.moveTo(318, 372);
  ctx.quadraticCurveTo(420, 335, 574, 365);
  ctx.moveTo(310, 390);
  ctx.lineTo(245, 520);
  ctx.moveTo(548, 392);
  ctx.lineTo(646, 520);
  ctx.stroke();

  const img = new Image();
  img.onload = () => {
    state.image = img;
    state.model = null;
    resetMask();
    state.session = registerAsset(createSessionState(), {
      kind: "image",
      name: "example-chair.png",
      size: 0,
      mime: "image/png",
      width: img.width,
      height: img.height,
      source: "example"
    });
    assetInfo.textContent = t("图片: example-chair.png / 示例", "Image: example-chair.png / example");
    draw();
    scheduleRealtimeRender("example");
  };
  img.src = demo.toDataURL("image/png");
}

function loadImage(file) {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    state.image = img;
    state.model = null;
    resetMask();
    URL.revokeObjectURL(url);
    registerImage(file, img);
    assetInfo.textContent = t("图片: ", "Image: ") + file.name + " / " + fileSize(file.size);
    setStatus("图片已导入", "Image Imported", "现在可以直接涂抹或圈选要修改的区域。", "Paint or select the region you want to edit.");
    draw();
  };
  img.src = url;
}

function loadModel(file) {
  state.image = null;
  state.model = { name: file.name, size: file.size };
  resetMask();
  state.session = registerAsset(createSessionState(), {
    kind: "model",
    name: file.name,
    size: file.size,
    mime: file.type || "",
    source: "browser"
  });
  assetInfo.textContent = t("模型: ", "Model: ") + file.name + " / " + fileSize(file.size);
  setStatus("模型已导入", "Model Imported", "当前先注册模型证据并显示占位预览，后面再接真实 3D 查看器。", "This version registers model evidence and shows a placeholder preview; real 3D viewing comes later.");
  draw();
}

function handleFile(file) {
  if (!file) return;
  if (file.type && file.type.startsWith("image/")) {
    loadImage(file);
    return;
  }
  const ext = file.name.split(".").pop().toLowerCase();
  if (["glb", "gltf", "obj", "fbx", "stl", "usdz"].includes(ext)) {
    loadModel(file);
    return;
  }
  setStatus("格式不支持", "Unsupported Format", "请导入图片或常见 3D 模型文件。", "Import an image or a common 3D model file.");
}

function beginStroke(e) {
  updateBrushCursor(e);
  if (!activeAsset() || state.tool === "select") return;
  e.preventDefault();
  state.generatedImage = null;
  state.drawing = true;
  sourceCanvas.setPointerCapture(e.pointerId);
  const p = point(e);
  if (state.tool === "brush" || state.tool === "erase") {
    state.strokes.push({
      kind: "path",
      mode: state.tool === "erase" ? "erase" : "brush",
      size: Number(brushSize.value),
      points: [p]
    });
  } else {
    state.draft = {
      kind: state.tool === "rect" ? "rect" : "circle",
      mode: "brush",
      size: Number(brushSize.value),
      start: p,
      end: p
    };
  }
  redrawMaskBitmap();
  scheduleDraw();
}

function extendStroke(e) {
  updateBrushCursor(e);
  if (!state.drawing) return;
  e.preventDefault();
  const p = point(e);
  if (state.draft) state.draft.end = p;
  else if (state.strokes.length) state.strokes[state.strokes.length - 1].points.push(p);
  redrawMaskBitmap();
  scheduleDraw();
}

function endStroke(e) {
  if (e && sourceCanvas.hasPointerCapture && sourceCanvas.hasPointerCapture(e.pointerId)) {
    sourceCanvas.releasePointerCapture(e.pointerId);
  }
  let changed = false;
  if (state.draft) {
    state.strokes.push(state.draft);
    state.draft = null;
    redrawMaskBitmap();
    scheduleDraw();
    changed = true;
  }
  if (state.drawing) changed = true;
  state.drawing = false;
  if (changed) scheduleRealtimeRender("stroke");
}

function updatePreview() {
  draw();
  scheduleRealtimeRender("preview");
  setStatus("预览已排队", "Preview Queued", "正在根据当前画布、遮罩和提示词请求输出。", "Requesting output from the current canvas, mask, and prompt.");
}

function clearMask() {
  const hadMask = state.strokes.length > 0;
  resetMask();
  draw();
  setApiState("local", "本地预览", "Local Preview");
  setStatus("遮罩已清空", "Mask Cleared", hadMask ? "底图保留，只清空编辑区域。" : "当前没有可清空的遮罩。", hadMask ? "The source stays; only the edit region was cleared." : "There is no mask to clear.");
}

function cycleAspectRatio() {
  state.aspectRatio = state.aspectRatio === "1:1" ? "16:9" : state.aspectRatio === "16:9" ? "4:5" : "1:1";
  updateRealtimeChips();
  setStatus("比例已切换", "Ratio Changed", "当前预览比例记录到生成请求里。", "The current ratio is stored in the generation request.");
  scheduleRealtimeRender("ratio");
}

function nextSeed() {
  state.seed = (state.seed * 9301 + 49297) % 233280;
  updateRealtimeChips();
  state.generatedImage = null;
  draw();
  setStatus("种子已刷新", "Seed Refreshed", "本地预览会按新种子变化。", "The local preview changes with the new seed.");
  scheduleRealtimeRender("seed");
}

function syncBrushSize(value) {
  brushSize.value = value;
  brushSizeDock.value = value;
  updateToolReadout();
  scheduleDraw();
}

function syncStrength(value) {
  strength.value = value;
  strengthDock.value = value;
  state.generatedImage = null;
  scheduleDraw();
}

document.querySelectorAll(".tool-row[data-tool], .tool-button[data-tool]").forEach((button) => {
  button.addEventListener("click", () => setTool(button.dataset.tool));
});

document.getElementById("clearBtn").addEventListener("click", clearMask);
document.getElementById("previewBtn").addEventListener("click", updatePreview);
document.getElementById("importImageBtn").addEventListener("click", () => imageInput.click());
document.getElementById("importImageNav").addEventListener("click", () => imageInput.click());
document.getElementById("importModelBtn").addEventListener("click", () => modelInput.click());
document.getElementById("importModelNav").addEventListener("click", () => modelInput.click());

imageInput.addEventListener("change", () => handleFile(imageInput.files[0]));
modelInput.addEventListener("change", () => handleFile(modelInput.files[0]));

document.addEventListener("dragover", (e) => e.preventDefault());
document.addEventListener("drop", (e) => {
  e.preventDefault();
  handleFile(e.dataTransfer.files[0]);
});

sourceCanvas.addEventListener("pointerdown", beginStroke);
sourceCanvas.addEventListener("pointermove", extendStroke);
sourceCanvas.addEventListener("pointerup", endStroke);
sourceCanvas.addEventListener("pointercancel", endStroke);
sourceCanvas.addEventListener("pointerenter", updateBrushCursor);
sourceCanvas.addEventListener("pointerleave", () => {
  state.drawing = false;
  state.draft = null;
  brushCursor.style.opacity = "0";
  scheduleDraw();
});

brushSize.addEventListener("input", () => syncBrushSize(brushSize.value));
brushSizeDock.addEventListener("input", () => syncBrushSize(brushSizeDock.value));
strength.addEventListener("input", () => {
  syncStrength(strength.value);
  scheduleRealtimeRender("strength");
});
strengthDock.addEventListener("input", () => {
  syncStrength(strengthDock.value);
  scheduleRealtimeRender("strength");
});

drawModeChip.addEventListener("click", () => {
  state.mode = state.mode === "draw" ? "text" : "draw";
  updateRealtimeChips();
  setStatus(state.mode === "draw" ? "绘制模式" : "仅文字模式", state.mode === "draw" ? "Draw Mode" : "Text Only Mode", state.mode === "draw" ? "画布笔迹会参与预览。" : "只使用提示词和参考输入。", state.mode === "draw" ? "Canvas strokes are used by the preview." : "Only prompt and reference input are used.");
  scheduleRealtimeRender("mode");
});

aspectRatioChip.addEventListener("click", cycleAspectRatio);
seedChip.addEventListener("click", nextSeed);
liveChip.addEventListener("click", () => {
  state.liveEnabled = !state.liveEnabled;
  updateRealtimeChips();
  setStatus(state.liveEnabled ? "实时已开启" : "实时已暂停", state.liveEnabled ? "Live Enabled" : "Live Paused", state.liveEnabled ? "画布变化会自动请求输出。" : "画布仍可编辑，但不会自动请求输出。", state.liveEnabled ? "Canvas changes will request output automatically." : "The canvas remains editable but will not request output automatically.");
  if (state.liveEnabled) scheduleRealtimeRender("live");
});

document.getElementById("examplesChip").addEventListener("click", () => {
  promptBox.value = t(
    "把遮罩区域变成浅色摄影棚里的真实椅子产品，保留草图结构和相机角度。",
    "Turn the masked area into a real chair product in a light photo studio while preserving sketch structure and camera angle."
  );
  promptBox.dataset.custom = "1";
  loadExampleAsset();
  setStatus("示例已载入", "Example Loaded", "可以直接画遮罩，右侧会自动排队输出。", "Paint a mask and the right side will queue output automatically.");
});

promptBox.addEventListener("input", () => {
  promptBox.dataset.custom = "1";
  scheduleRealtimeRender("prompt");
});

document.querySelectorAll(".lang button").forEach((button) => {
  button.addEventListener("click", () => {
    state.lang = button.dataset.lang;
    document.querySelectorAll(".lang button").forEach((node) => node.classList.toggle("active", node === button));
    applyLanguage();
  });
});

document.addEventListener("keydown", (e) => {
  if (e.target && /textarea|input/i.test(e.target.tagName)) return;
  const key = e.key.toLowerCase();
  if (key === "v") setTool("select");
  if (key === "b") setTool("brush");
  if (key === "e" || key === "x") setTool("erase");
  if (key === "r") setTool("rect");
  if (key === "c") setTool("circle");
  if (key === "[") syncBrushSize(Math.max(10, Number(brushSize.value) - 4));
  if (key === "]") syncBrushSize(Math.min(96, Number(brushSize.value) + 4));
});

window.addEventListener("resize", fitAll);

syncBrushSize(brushSize.value);
syncStrength(strength.value);
setTool("brush");
updateRealtimeChips();
setApiState("local", "本地预览", "Local Preview");
fitAll();
