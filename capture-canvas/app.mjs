import { buildGenerationRequest, createSessionState, registerAsset } from "./capture-core.mjs";

const copy = {
  en: {
    tagline: "Realtime evidence canvas for AI product generation.",
    tools: "Tools",
    select: "Select",
    brush: "Brush",
    eraser: "Eraser",
    rect: "Rectangle",
    circle: "Circle",
    input: "Input",
    importImage: "Import image",
    importModel: "Import model",
    example: "Example",
    generate: "Generate",
    controls: "Controls",
    provider: "Provider",
    providerAuto: "Auto",
    providerMock: "Mock",
    providerOpenai: "OpenAI",
    providerCustom: "Custom API",
    apiHelp: "Set .env, restart the server, then test the provider.",
    apiSettings: "API Settings",
    apiSettingsTitle: "API Settings",
    apiSettingsSubtitle: "Save provider URL, model, and key to local .env. Keys are never shown after saving.",
    apiBaseUrl: "Base URL",
    apiModel: "Image model",
    apiMethod: "Method",
    apiKey: "API Key",
    apiAuthHeader: "Auth header",
    apiAuthScheme: "Auth scheme",
    testApi: "Test API",
    save: "Save",
    close: "Close",
    keySaved: "Key saved. Leave blank to keep it.",
    noKeySaved: "No key saved.",
    saved: "Saved to local .env.",
    apiTestOk: "API connection passed",
    apiTestFailed: "API connection failed",
    apiTestLocal: "Local preview is active. Choose OpenAI or Custom API to test a remote provider.",
    staticDemo: "Static demo",
    staticDemoText: "Public demo mode is active. Canvas editing works, while cloud API calls require a local or hosted server.",
    apiOpenAiSubtitle: "Configure base URL, API key, and image model.",
    apiCustomSubtitle: "Configure a customer-owned compatible render endpoint.",
    apiLocal: "Local preview only",
    apiOpenAiReady: "OpenAI configured",
    apiCustomReady: "Custom API configured",
    apiMissing: "Provider not configured",
    brushSize: "Brush size",
    strength: "Strength",
    safety: "Keys stay on the local server. The browser only sends canvas and mask data.",
    subtitle: "realtime AI edit canvas",
    inputCanvas: "Input canvas",
    editable: "editable",
    emptyTitle: "Drop evidence here",
    emptyBody: "Import an image/model or load the example, then paint the edit region.",
    outputCanvas: "Realtime output",
    asset: "Current evidence",
    size: "size",
    ai: "AI",
    ready: "Ready",
    readyText: "Load evidence and paint a region.",
    localPreview: "Local preview",
    apiOutput: "API output",
    apiError: "API error",
    rendering: "Rendering",
    idle: "Idle",
    checking: "Checking",
    noKey: "No API key configured; using local preview.",
    importedImage: "Image imported",
    importedImageText: "Paint or select the region you want to edit.",
    importedModel: "Model imported",
    importedModelText: "Model evidence is registered now; real 3D viewing comes in the next adapter step.",
    unsupported: "Unsupported format",
    unsupportedText: "Import an image or a common 3D model file.",
    maskCleared: "Mask cleared",
    maskClearedText: "The source stays; only the edit region was cleared.",
    nothingClear: "There is no mask to clear.",
    undo: "Undo",
    redo: "Redo",
    previewQueued: "Preview queued",
    previewQueuedText: "Requesting output from the current canvas, mask, and prompt.",
    outputUpdated: "Realtime output updated",
    outputUpdatedText: "The right canvas uses the API result.",
    live: "Live",
    paused: "Paused",
    liveOn: "Live enabled",
    liveOff: "Live paused",
    liveOnText: "Canvas changes will request output automatically.",
    liveOffText: "Canvas remains editable but will not request output automatically.",
    draw: "Draw",
    textOnly: "Text only",
    seed: "Seed ",
    selectHint: "Select mode views the canvas without painting a mask.",
    brushHint: "Drag the brush to add the edit region.",
    eraseHint: "Drag the eraser to remove extra mask.",
    rectHint: "Drag to create a rectangular region.",
    circleHint: "Drag to create a circular region.",
    selected: "Region selected",
    selectedText: "Drag the selected mask region to move it.",
    layerChanged: "Layer updated",
    layerChangedText: "Selected region was updated.",
    lockLayer: "Lock",
    bringToFront: "Bring to front",
    bringForward: "Bring forward",
    sendBackward: "Send backward",
    sendToBack: "Send to back",
    duplicateLayer: "Duplicate",
    deleteLayer: "Delete",
    flipHorizontal: "Flip Horizontal",
    flipVertical: "Flip Vertical",
    fitScreen: "Fit to screen",
    fillScreen: "Fill screen",
    noSelection: "No region selected",
    noSelectionText: "Click a mask region first, then drag to move it.",
    exampleLoaded: "Example loaded",
    exampleLoadedText: "Paint a mask and the right side will queue output automatically.",
    promptDefault: "Render the selected region as an HD photorealistic product image while preserving shape, camera angle, and material boundaries.",
    promptExample: "Turn the masked area into a real chair product in a light photo studio while preserving sketch structure and camera angle.",
    waiting: "Waiting for input",
    waitingText: "Import an image or model to start.",
    livePreview: "Live preview",
    livePreviewText: "Local simulated output appears here.",
    imageLabel: "Image: ",
    modelLabel: "Model: ",
  },
  cn: {
    tagline: "\u9762\u5411 AI \u4ea7\u54c1\u751f\u6210\u7684\u5373\u65f6\u8bc1\u636e\u753b\u5e03\u3002",
    tools: "\u5de5\u5177",
    select: "\u9009\u62e9",
    brush: "\u753b\u7b14",
    eraser: "\u6a61\u76ae\u64e6",
    rect: "\u77e9\u5f62",
    circle: "\u5706\u5f62",
    input: "\u8f93\u5165",
    importImage: "\u5bfc\u5165\u56fe\u7247",
    importModel: "\u5bfc\u5165\u6a21\u578b",
    example: "\u793a\u4f8b",
    generate: "\u751f\u6210",
    controls: "\u63a7\u5236",
    provider: "\u63d0\u4f9b\u65b9",
    providerAuto: "\u81ea\u52a8",
    providerMock: "\u672c\u5730\u9884\u89c8",
    providerOpenai: "OpenAI",
    providerCustom: "\u81ea\u5b9a\u4e49 API",
    apiHelp: "\u586b\u597d .env \u5e76\u91cd\u542f\u670d\u52a1\u540e\uff0c\u518d\u6d4b\u8bd5\u63d0\u4f9b\u65b9\u3002",
    apiSettings: "API \u8bbe\u7f6e",
    apiSettingsTitle: "API \u8bbe\u7f6e",
    apiSettingsSubtitle: "\u4fdd\u5b58\u5e73\u53f0\u5730\u5740\u3001\u6a21\u578b\u548c Key \u5230\u672c\u5730 .env\u3002Key \u4fdd\u5b58\u540e\u4e0d\u4f1a\u56de\u663e\u3002",
    apiBaseUrl: "\u8bf7\u6c42\u5730\u5740",
    apiModel: "\u751f\u56fe\u6a21\u578b",
    apiMethod: "\u8bf7\u6c42\u65b9\u6cd5",
    apiKey: "API Key",
    apiAuthHeader: "\u9274\u6743\u5934",
    apiAuthScheme: "\u9274\u6743\u65b9\u5f0f",
    testApi: "\u6d4b\u8bd5 API",
    save: "\u4fdd\u5b58",
    close: "\u5173\u95ed",
    keySaved: "\u5df2\u4fdd\u5b58 Key\uff0c\u7559\u7a7a\u4fdd\u6301\u4e0d\u53d8\u3002",
    noKeySaved: "\u8fd8\u6ca1\u6709\u4fdd\u5b58 Key\u3002",
    saved: "\u5df2\u4fdd\u5b58\u5230\u672c\u5730 .env\u3002",
    apiTestOk: "API \u8fde\u63a5\u901a\u8fc7",
    apiTestFailed: "API \u8fde\u63a5\u5931\u8d25",
    apiTestLocal: "\u5f53\u524d\u662f\u672c\u5730\u9884\u89c8\u3002\u8bf7\u9009\u62e9 OpenAI \u6216\u81ea\u5b9a\u4e49 API \u518d\u6d4b\u8bd5\u8fdc\u7a0b\u63d0\u4f9b\u65b9\u3002",
    staticDemo: "\u9759\u6001\u6f14\u793a",
    staticDemoText: "\u5f53\u524d\u662f\u516c\u5f00\u9759\u6001\u6f14\u793a\u6a21\u5f0f\u3002\u753b\u5e03\u7f16\u8f91\u53ef\u7528\uff0c\u4e91\u7aef API \u9700\u8981\u672c\u5730\u6216\u7ebf\u4e0a\u670d\u52a1\u7aef\u3002",
    apiOpenAiSubtitle: "\u914d\u7f6e\u8bf7\u6c42\u5730\u5740\u3001API Key \u548c\u751f\u56fe\u6a21\u578b\u3002",
    apiCustomSubtitle: "\u914d\u7f6e\u5ba2\u6237\u81ea\u6709\u7684\u517c\u5bb9\u751f\u56fe\u63a5\u53e3\u3002",
    apiLocal: "\u4ec5\u672c\u5730\u9884\u89c8",
    apiOpenAiReady: "OpenAI \u5df2\u914d\u7f6e",
    apiCustomReady: "\u81ea\u5b9a\u4e49 API \u5df2\u914d\u7f6e",
    apiMissing: "\u63d0\u4f9b\u65b9\u672a\u914d\u7f6e",
    brushSize: "\u753b\u7b14\u5927\u5c0f",
    strength: "\u5f3a\u5ea6",
    safety: "\u5bc6\u94a5\u53ea\u7559\u5728\u672c\u5730\u670d\u52a1\u7aef\uff0c\u6d4f\u89c8\u5668\u53ea\u53d1\u9001\u753b\u5e03\u548c\u906e\u7f69\u6570\u636e\u3002",
    subtitle: "\u5373\u65f6 AI \u7f16\u8f91\u753b\u5e03",
    inputCanvas: "\u8f93\u5165\u753b\u5e03",
    editable: "\u53ef\u7f16\u8f91",
    emptyTitle: "\u628a\u8bc1\u636e\u653e\u5230\u8fd9\u91cc",
    emptyBody: "\u5bfc\u5165\u56fe\u7247/\u6a21\u578b\u6216\u52a0\u8f7d\u793a\u4f8b\uff0c\u7136\u540e\u6d82\u62b9\u8981\u4fee\u6539\u7684\u533a\u57df\u3002",
    outputCanvas: "\u5b9e\u65f6\u8f93\u51fa",
    asset: "\u5f53\u524d\u8bc1\u636e",
    size: "\u5927\u5c0f",
    ai: "AI",
    ready: "\u51c6\u5907\u5c31\u7eea",
    readyText: "\u52a0\u8f7d\u8bc1\u636e\u5e76\u6d82\u62b9\u533a\u57df\u3002",
    localPreview: "\u672c\u5730\u9884\u89c8",
    apiOutput: "API \u8f93\u51fa",
    apiError: "API \u9519\u8bef",
    rendering: "\u751f\u6210\u4e2d",
    idle: "\u7a7a\u95f2",
    checking: "\u68c0\u67e5\u4e2d",
    noKey: "\u672a\u914d\u7f6e API key\uff0c\u5f53\u524d\u4f7f\u7528\u672c\u5730\u9884\u89c8\u3002",
    importedImage: "\u56fe\u7247\u5df2\u5bfc\u5165",
    importedImageText: "\u73b0\u5728\u53ef\u4ee5\u6d82\u62b9\u6216\u6846\u9009\u8981\u4fee\u6539\u7684\u533a\u57df\u3002",
    importedModel: "\u6a21\u578b\u5df2\u5bfc\u5165",
    importedModelText: "\u5f53\u524d\u7248\u672c\u5148\u6ce8\u518c\u6a21\u578b\u8bc1\u636e\uff0c\u771f\u6b63 3D \u67e5\u770b\u5668\u653e\u5230\u4e0b\u4e00\u6b65\u9002\u914d\u3002",
    unsupported: "\u683c\u5f0f\u4e0d\u652f\u6301",
    unsupportedText: "\u8bf7\u5bfc\u5165\u56fe\u7247\u6216\u5e38\u89c1 3D \u6a21\u578b\u6587\u4ef6\u3002",
    maskCleared: "\u906e\u7f69\u5df2\u6e05\u7a7a",
    maskClearedText: "\u5e95\u56fe\u4fdd\u7559\uff0c\u53ea\u6e05\u7a7a\u7f16\u8f91\u533a\u57df\u3002",
    nothingClear: "\u5f53\u524d\u6ca1\u6709\u53ef\u6e05\u7a7a\u7684\u906e\u7f69\u3002",
    undo: "\u64a4\u9500",
    redo: "\u91cd\u505a",
    previewQueued: "\u9884\u89c8\u5df2\u6392\u961f",
    previewQueuedText: "\u6b63\u5728\u6839\u636e\u5f53\u524d\u753b\u5e03\u3001\u906e\u7f69\u548c\u63d0\u793a\u8bcd\u8bf7\u6c42\u8f93\u51fa\u3002",
    outputUpdated: "\u5b9e\u65f6\u8f93\u51fa\u5df2\u66f4\u65b0",
    outputUpdatedText: "\u53f3\u4fa7\u753b\u5e03\u6765\u81ea API \u8fd4\u56de\u7ed3\u679c\u3002",
    live: "\u5b9e\u65f6",
    paused: "\u6682\u505c",
    liveOn: "\u5b9e\u65f6\u5df2\u5f00\u542f",
    liveOff: "\u5b9e\u65f6\u5df2\u6682\u505c",
    liveOnText: "\u753b\u5e03\u53d8\u5316\u4f1a\u81ea\u52a8\u8bf7\u6c42\u8f93\u51fa\u3002",
    liveOffText: "\u753b\u5e03\u4ecd\u53ef\u7f16\u8f91\uff0c\u4f46\u4e0d\u4f1a\u81ea\u52a8\u8bf7\u6c42\u8f93\u51fa\u3002",
    draw: "\u7ed8\u5236",
    textOnly: "\u4ec5\u6587\u5b57",
    seed: "\u79cd\u5b50 ",
    selectHint: "\u9009\u62e9\u6a21\u5f0f\u53ea\u67e5\u770b\u753b\u5e03\uff0c\u4e0d\u7ed8\u5236\u906e\u7f69\u3002",
    brushHint: "\u62d6\u52a8\u753b\u7b14\u6dfb\u52a0\u8981\u7f16\u8f91\u7684\u533a\u57df\u3002",
    eraseHint: "\u62d6\u52a8\u6a61\u76ae\u64e6\u79fb\u9664\u591a\u4f59\u906e\u7f69\u3002",
    rectHint: "\u62d6\u62fd\u521b\u5efa\u77e9\u5f62\u533a\u57df\u3002",
    circleHint: "\u62d6\u62fd\u521b\u5efa\u5706\u5f62\u533a\u57df\u3002",
    selected: "\u5df2\u9009\u4e2d\u533a\u57df",
    selectedText: "\u62d6\u52a8\u9009\u4e2d\u7684\u906e\u7f69\u533a\u57df\u5373\u53ef\u79fb\u52a8\u3002",
    layerChanged: "\u56fe\u5c42\u5df2\u66f4\u65b0",
    layerChangedText: "\u5df2\u66f4\u65b0\u9009\u4e2d\u533a\u57df\u3002",
    lockLayer: "\u9501\u5b9a",
    bringToFront: "\u7f6e\u4e8e\u9876\u5c42",
    bringForward: "\u4e0a\u79fb\u4e00\u5c42",
    sendBackward: "\u4e0b\u79fb\u4e00\u5c42",
    sendToBack: "\u7f6e\u4e8e\u5e95\u5c42",
    duplicateLayer: "\u590d\u5236",
    deleteLayer: "\u5220\u9664",
    flipHorizontal: "\u6c34\u5e73\u7ffb\u8f6c",
    flipVertical: "\u5782\u76f4\u7ffb\u8f6c",
    fitScreen: "\u9002\u5e94\u753b\u9762",
    fillScreen: "\u586b\u5145\u753b\u9762",
    noSelection: "\u672a\u9009\u4e2d\u533a\u57df",
    noSelectionText: "\u5148\u70b9\u51fb\u4e00\u4e2a\u906e\u7f69\u533a\u57df\uff0c\u518d\u62d6\u52a8\u79fb\u52a8\u3002",
    exampleLoaded: "\u793a\u4f8b\u5df2\u52a0\u8f7d",
    exampleLoadedText: "\u53ef\u4ee5\u76f4\u63a5\u753b\u906e\u7f69\uff0c\u53f3\u4fa7\u4f1a\u81ea\u52a8\u6392\u961f\u8f93\u51fa\u3002",
    promptDefault: "\u5c06\u9009\u4e2d\u533a\u57df\u751f\u6210\u4e3a\u9ad8\u6e05\u5199\u5b9e\u4ea7\u54c1\u56fe\uff0c\u4fdd\u7559\u5f62\u72b6\u3001\u76f8\u673a\u89d2\u5ea6\u548c\u6750\u8d28\u8fb9\u754c\u3002",
    promptExample: "\u628a\u906e\u7f69\u533a\u57df\u53d8\u6210\u6d45\u8272\u6444\u5f71\u68da\u91cc\u7684\u771f\u5b9e\u6905\u5b50\u4ea7\u54c1\uff0c\u4fdd\u7559\u8349\u56fe\u7ed3\u6784\u548c\u76f8\u673a\u89d2\u5ea6\u3002",
    waiting: "\u7b49\u5f85\u8f93\u5165",
    waitingText: "\u5bfc\u5165\u56fe\u7247\u6216\u6a21\u578b\u5f00\u59cb\u3002",
    livePreview: "\u5b9e\u65f6\u9884\u89c8",
    livePreviewText: "\u8fd9\u91cc\u663e\u793a\u672c\u5730\u6a21\u62df\u8f93\u51fa\u3002",
    imageLabel: "\u56fe\u7247: ",
    modelLabel: "\u6a21\u578b: ",
  },
};

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
  redoStack: [],
  selectedStrokeIndex: -1,
  movingSelection: false,
  resizingSelection: false,
  resizeHandle: "",
  resizeOriginal: null,
  resizeBounds: null,
  moveLast: null,
  drawing: false,
  draft: null,
  liveEnabled: true,
  renderTimer: 0,
  renderSeq: 0,
  renderController: null,
  lastRequest: null,
  apiStatus: {},
  apiConfig: null,
  apiConfigTab: "openai",
  raf: 0,
};

const $ = (id) => document.getElementById(id);
const ui = {
  board: $("board"),
  sourceCanvas: $("sourceCanvas"),
  resultCanvas: $("resultCanvas"),
  sourceEmpty: $("sourceEmpty"),
  layerMenu: $("layerMenu"),
  assetInfo: $("assetInfo"),
  statusTitle: $("statusTitle"),
  statusText: $("statusText"),
  apiState: $("apiState"),
  requestState: $("requestState"),
  outputBadge: $("outputBadge"),
  imageInput: $("imageInput"),
  modelInput: $("modelInput"),
  promptBox: $("prompt"),
  brushSize: $("brushSize"),
  strength: $("strength"),
  brushSizeDock: $("brushSizeDock"),
  strengthDock: $("strengthDock"),
  brushCursor: $("brushCursor"),
  toolModeText: $("toolModeText"),
  brushSizeText: $("brushSizeText"),
  drawModeChip: $("drawModeChip"),
  aspectRatioChip: $("aspectRatioChip"),
  seedChip: $("seedChip"),
  liveChip: $("liveChip"),
  providerSelect: $("providerSelect"),
  apiSummary: $("apiSummary"),
  apiHelp: $("apiHelp"),
  testApiBtn: $("testApiBtn"),
  openApiSettingsBtn: $("openApiSettingsBtn"),
  apiModal: $("apiModal"),
  apiOpenAiTab: $("apiOpenAiTab"),
  apiCustomTab: $("apiCustomTab"),
  apiProviderTitle: $("apiProviderTitle"),
  apiProviderSubtitle: $("apiProviderSubtitle"),
  apiBaseUrlInput: $("apiBaseUrlInput"),
  apiModelInput: $("apiModelInput"),
  apiMethodInput: $("apiMethodInput"),
  apiKeyInput: $("apiKeyInput"),
  apiKeySavedText: $("apiKeySavedText"),
  apiAuthHeaderInput: $("apiAuthHeaderInput"),
  apiAuthSchemeInput: $("apiAuthSchemeInput"),
  apiModalStatus: $("apiModalStatus"),
  closeApiSettingsBtn: $("closeApiSettingsBtn"),
  saveApiSettingsBtn: $("saveApiSettingsBtn"),
  modalTestApiBtn: $("modalTestApiBtn"),
};

const sctx = ui.sourceCanvas.getContext("2d");
const rctx = ui.resultCanvas.getContext("2d");
const maskCanvas = document.createElement("canvas");
const maskCtx = maskCanvas.getContext("2d");
const fxCanvas = document.createElement("canvas");
const fxCtx = fxCanvas.getContext("2d");
const STATIC_API_CONFIG_KEY = "dcc-capture-static-api-config";

function tr(key) {
  return (copy[state.lang] && copy[state.lang][key]) || copy.en[key] || key;
}

function setStatus(titleKey, textKey, textOverride = "") {
  ui.statusTitle.textContent = tr(titleKey);
  ui.statusText.textContent = textOverride || tr(textKey);
}

function setApiState(kind, labelKey) {
  ui.apiState.textContent = tr(labelKey);
  ui.apiState.classList.toggle("busy", kind === "busy");
  ui.apiState.classList.toggle("error", kind === "error");
  ui.apiState.classList.toggle("api", kind === "api");
  ui.outputBadge.textContent = tr(kind === "api" ? "apiOutput" : "localPreview");
}

function setRequestState(kind, labelKey) {
  ui.requestState.textContent = tr(labelKey);
  ui.requestState.classList.toggle("busy", kind === "busy");
  ui.requestState.classList.toggle("error", kind === "error");
  ui.requestState.classList.toggle("api", kind === "api");
}

function activeAsset() {
  return state.image || state.model;
}

function fileSize(bytes) {
  return bytes > 1048576
    ? `${(bytes / 1048576).toFixed(1)} MB`
    : `${Math.max(1, Math.round((bytes || 0) / 1024))} KB`;
}

function localPoint(e) {
  const rect = ui.sourceCanvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function updateI18n() {
  document.documentElement.lang = state.lang === "cn" ? "zh-CN" : "en";
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = tr(node.dataset.i18n);
  });
  if (!ui.promptBox.dataset.custom) ui.promptBox.value = tr("promptDefault");
  [...ui.providerSelect.options].forEach((option) => {
    if (option.value === "auto") option.textContent = tr("providerAuto");
    if (option.value === "mock-local") option.textContent = tr("providerMock");
    if (option.value === "openai") option.textContent = tr("providerOpenai");
    if (option.value === "custom-http") option.textContent = tr("providerCustom");
  });
  updateToolReadout();
  updateChips();
  setStatus("ready", "readyText");
  if (!activeAsset()) ui.assetInfo.textContent = state.lang === "cn" ? "\u7b49\u5f85\u5bfc\u5165\u3002" : "Waiting.";
  setApiState(ui.apiState.classList.contains("api") ? "api" : "local", ui.apiState.classList.contains("api") ? "apiOutput" : "localPreview");
  setRequestState("local", "idle");
  updateApiSummary(state.apiStatus);
  draw();
}

function updateApiSummary(payload = {}) {
  state.apiStatus = payload;
  if (payload.static_demo) {
    ui.apiSummary.textContent = tr("staticDemo");
    ui.apiHelp.textContent = tr("staticDemoText");
    return;
  }
  if (payload.openai_configured) {
    ui.apiSummary.textContent = tr("apiOpenAiReady");
  } else if (payload.custom_api_configured) {
    ui.apiSummary.textContent = `${tr("apiCustomReady")}${payload.custom_api_host ? ` (${payload.custom_api_host})` : ""}`;
  } else {
    ui.apiSummary.textContent = tr("apiLocal");
  }
  ui.apiHelp.textContent = tr("apiHelp");
}

function enterStaticDemoMode(text = tr("staticDemoText")) {
  state.apiStatus = { static_demo: true };
  updateApiSummary(state.apiStatus);
  state.generatedImage = null;
  setApiState("local", "localPreview");
  setRequestState("local", "idle");
  setStatus("staticDemo", "staticDemoText", text);
  draw();
}

function loadStaticApiConfig() {
  try {
    return JSON.parse(localStorage.getItem(STATIC_API_CONFIG_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveStaticApiConfig(payload) {
  const current = loadStaticApiConfig();
  const providerKey = payload.provider === "openai" ? "openai" : "custom";
  const next = {
    ...current,
    static_demo: true,
    [providerKey]: {
      ...(current[providerKey] || {}),
      base_url: payload.baseUrl,
      model: payload.model,
      method: payload.method,
      auth_header: payload.authHeader,
      auth_scheme: payload.authScheme,
      key_saved: Boolean(payload.apiKey || current[providerKey]?.api_key),
      api_key: payload.apiKey || current[providerKey]?.api_key || "",
    },
  };
  localStorage.setItem(STATIC_API_CONFIG_KEY, JSON.stringify(next));
  return next;
}

async function loadApiConfig() {
  try {
    const response = await fetch("/api/config", { cache: "no-store" });
    state.apiConfig = await response.json();
  } catch {
    const stored = loadStaticApiConfig();
    state.apiConfig = {
      static_demo: true,
      ...stored,
      openai: { base_url: "https://api.openai.com/v1", model: "gpt-image-2", ...(stored.openai || {}) },
      custom: { method: "POST", auth_header: "authorization", auth_scheme: "Bearer", ...(stored.custom || {}) },
    };
    enterStaticDemoMode();
  }
  renderApiConfigForm();
}

function openApiSettings(tab = state.apiConfigTab) {
  state.apiConfigTab = tab;
  ui.apiModal.classList.add("open");
  ui.apiModal.setAttribute("aria-hidden", "false");
  loadApiConfig().catch((error) => {
    ui.apiModalStatus.textContent = String(error.message || error);
  });
}

function closeApiSettings() {
  ui.apiModal.classList.remove("open");
  ui.apiModal.setAttribute("aria-hidden", "true");
  ui.apiKeyInput.value = "";
}

function renderApiConfigForm() {
  const config = state.apiConfig || {};
  const isOpenAi = state.apiConfigTab === "openai";
  const item = isOpenAi ? config.openai || {} : config.custom || {};
  ui.apiOpenAiTab.classList.toggle("active", isOpenAi);
  ui.apiCustomTab.classList.toggle("active", !isOpenAi);
  ui.apiProviderTitle.textContent = isOpenAi ? "OpenAI" : "Custom API";
  ui.apiProviderSubtitle.textContent = isOpenAi ? tr("apiOpenAiSubtitle") : tr("apiCustomSubtitle");
  ui.apiBaseUrlInput.value = item.base_url || (isOpenAi ? "https://api.openai.com/v1" : "");
  ui.apiModelInput.value = item.model || (isOpenAi ? "gpt-image-2" : "");
  ui.apiMethodInput.value = item.method || "POST";
  ui.apiMethodInput.disabled = isOpenAi;
  ui.apiAuthHeaderInput.value = item.auth_header || "authorization";
  ui.apiAuthSchemeInput.value = item.auth_scheme || "Bearer";
  ui.apiAuthHeaderInput.disabled = isOpenAi;
  ui.apiAuthSchemeInput.disabled = isOpenAi;
  ui.apiKeyInput.value = "";
  ui.apiKeySavedText.textContent = item.key_saved ? tr("keySaved") : tr("noKeySaved");
  ui.apiModalStatus.textContent = tr("ready");
}

function apiFormPayload(provider = state.apiConfigTab) {
  const config = state.apiConfig || {};
  const saved = provider === "openai" ? config.openai || {} : config.custom || {};
  return {
    provider,
    baseUrl: (ui.apiBaseUrlInput.value || saved.base_url || "").trim(),
    model: (ui.apiModelInput.value || saved.model || "").trim(),
    apiKey: ui.apiKeyInput.value.trim() || saved.api_key || "",
    method: ui.apiMethodInput.value || saved.method || "POST",
    authHeader: (ui.apiAuthHeaderInput.value || saved.auth_header || "authorization").trim(),
    authScheme: (ui.apiAuthSchemeInput.value || saved.auth_scheme || "Bearer").trim(),
  };
}

async function saveApiSettings() {
  const payload = apiFormPayload(state.apiConfigTab);
  ui.apiModalStatus.textContent = "Saving...";
  try {
    const response = await fetch("/api/config", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!data.ok) throw new Error(data.message || "Save failed");
    state.apiConfig = data.config;
    await checkApiStatus();
  } catch {
    state.apiConfig = saveStaticApiConfig(payload);
    enterStaticDemoMode();
  }
  ui.apiKeyInput.value = "";
  renderApiConfigForm();
  ui.apiModalStatus.textContent = tr("saved");
}

function directCustomConfig(payload = {}) {
  const stored = loadStaticApiConfig();
  const saved = stored.custom || state.apiConfig?.custom || {};
  return {
    provider: "custom-http",
    baseUrl: payload.baseUrl || saved.base_url || "",
    model: payload.model || saved.model || "",
    apiKey: payload.apiKey || saved.api_key || "",
    method: payload.method || saved.method || "POST",
    authHeader: payload.authHeader || saved.auth_header || "authorization",
    authScheme: payload.authScheme || saved.auth_scheme || "Bearer",
  };
}

async function callDirectCustomApi(requestBody, payload = {}) {
  const config = directCustomConfig(payload);
  if (!config.baseUrl) throw new Error(state.lang === "cn" ? "\u8bf7\u5148\u586b\u5199 Custom API \u8bf7\u6c42\u5730\u5740\u3002" : "Set the Custom API URL first.");
  const headers = { "content-type": "application/json" };
  if (config.apiKey) headers[config.authHeader || "authorization"] = `${config.authScheme || "Bearer"} ${config.apiKey}`.trim();
  const response = await fetch(config.baseUrl, {
    method: config.method || "POST",
    headers,
    body: JSON.stringify({
      ...requestBody,
      model: config.model || requestBody.model || "",
      dcc_capture_bridge: {
        ...(requestBody.dcc_capture_bridge || {}),
        static_demo_direct: true,
        contract: "custom-http-json-v1",
      },
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || `HTTP ${response.status}`);
  return data;
}

async function testApiConnection(source = "panel") {
  const provider = source === "modal" ? state.apiConfigTab : ui.providerSelect.value;
  if (provider === "auto" || provider === "mock-local") {
    const text = tr("apiTestLocal");
    if (source === "modal") ui.apiModalStatus.textContent = text;
    setApiState("local", "apiLocal");
    setRequestState("local", "idle");
    setStatus("apiLocal", "apiTestLocal", text);
    return;
  }

  const payload = source === "modal" ? apiFormPayload(provider) : { provider };
  if (source === "modal") ui.apiModalStatus.textContent = `${tr("checking")}...`;
  setApiState("busy", "checking");
  setRequestState("busy", "checking");

  try {
    const response = await fetch("/api/test-provider", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    const text = state.lang === "cn" ? data.message_cn || data.cn : data.message_en || data.en;
    if (source === "modal") ui.apiModalStatus.textContent = text || (data.ok ? tr("apiTestOk") : tr("apiTestFailed"));
    setApiState(data.ok ? "api" : "error", data.ok ? "apiTestOk" : "apiTestFailed");
    setRequestState(data.ok ? "api" : "error", data.ok ? "apiTestOk" : "apiTestFailed");
    setStatus(data.ok ? "apiTestOk" : "apiTestFailed", data.ok ? "apiTestOk" : "apiTestFailed", text || "");
  } catch (error) {
    if (provider === "custom-http") {
      try {
        const data = await callDirectCustomApi({
          schema_version: "0.2.0",
          task: "connection_test",
          prompt: "Instant Canvas connection test",
          dcc_capture_bridge: { test: true, contract: "custom-http-json-v1" },
        }, payload);
        const text = state.lang === "cn" ? data.message_cn || data.message || "Custom API \u8fde\u63a5\u901a\u8fc7" : data.message_en || data.message || "Custom API connection passed";
        if (source === "modal") ui.apiModalStatus.textContent = text;
        setApiState("api", "apiTestOk");
        setRequestState("api", "apiTestOk");
        setStatus("apiTestOk", "apiTestOk", text);
        return;
      } catch (directError) {
        const text = String(directError.message || directError);
        if (source === "modal") ui.apiModalStatus.textContent = text;
        setApiState("error", "apiTestFailed");
        setRequestState("error", "apiTestFailed");
        setStatus("apiTestFailed", "apiTestFailed", text);
        return;
      }
    }
    const text = provider === "openai" ? tr("staticDemoText") : String(error.message || error);
    if (source === "modal") ui.apiModalStatus.textContent = text;
    setApiState(provider === "openai" ? "local" : "error", provider === "openai" ? "staticDemo" : "apiTestFailed");
    setRequestState(provider === "openai" ? "local" : "error", provider === "openai" ? "idle" : "apiTestFailed");
    setStatus(provider === "openai" ? "staticDemo" : "apiTestFailed", provider === "openai" ? "staticDemoText" : "apiTestFailed", text);
  }
}

function updateToolReadout() {
  ui.toolModeText.textContent = tr(state.tool === "erase" ? "eraser" : state.tool);
  ui.brushSizeText.textContent = `${Number(ui.brushSize.value)} px`;
  ui.brushCursor.style.setProperty("--brush", `${Number(ui.brushSize.value)}px`);
  document.querySelectorAll("[data-tool]").forEach((node) => {
    node.classList.toggle("active", node.dataset.tool === state.tool);
  });
  ui.sourceCanvas.style.cursor = state.tool === "select" ? "grab" : "none";
  ui.brushCursor.classList.toggle("erase", state.tool === "erase");
  ui.brushCursor.classList.toggle("shape", state.tool === "rect" || state.tool === "circle");
}

function updateChips() {
  ui.drawModeChip.textContent = state.mode === "draw" ? tr("draw") : tr("textOnly");
  ui.drawModeChip.classList.toggle("active", state.mode === "draw");
  ui.aspectRatioChip.textContent = state.aspectRatio;
  ui.seedChip.textContent = `${tr("seed")}${state.seed}`;
  ui.liveChip.textContent = state.liveEnabled ? tr("live") : tr("paused");
  ui.liveChip.classList.toggle("active", state.liveEnabled);
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
  fitVisibleCanvas(ui.sourceCanvas);
  fitVisibleCanvas(ui.resultCanvas);
  fitBufferCanvas(maskCanvas, maskCtx, ui.sourceCanvas.clientWidth, ui.sourceCanvas.clientHeight);
  fitBufferCanvas(fxCanvas, fxCtx, ui.resultCanvas.clientWidth, ui.resultCanvas.clientHeight);
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
  state.renderTimer = window.setTimeout(() => requestRealtimeRender(reason), reason === "preview" ? 0 : 620);
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
  const w = canvas.clientWidth || canvas.width;
  const h = canvas.clientHeight || canvas.height;
  const scale = Math.min((w * 0.82) / img.width, (h * 0.82) / img.height);
  const iw = img.width * scale;
  const ih = img.height * scale;
  return { x: (w - iw) / 2, y: (h - ih) / 2, w: iw, h: ih };
}

function placeholder(ctx, canvas, title, subtitle) {
  const w = canvas.clientWidth || canvas.width;
  const h = canvas.clientHeight || canvas.height;
  ctx.fillStyle = canvas === ui.sourceCanvas ? "#e7e8e3" : "#dce0de";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#1c232c";
  ctx.font = "700 18px Segoe UI, Microsoft YaHei, sans-serif";
  ctx.fillText(title, 42, h / 2 - 10);
  ctx.fillStyle = "#697480";
  ctx.font = "13px Segoe UI, Microsoft YaHei, sans-serif";
  ctx.fillText(subtitle, 42, h / 2 + 18);
}

function drawModel(ctx, canvas) {
  const w = canvas.clientWidth || canvas.width;
  const h = canvas.clientHeight || canvas.height;
  const cx = w / 2;
  const cy = h / 2;

  ctx.fillStyle = canvas === ui.sourceCanvas ? "#e7e8e3" : "#dce0de";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#263246";
  ctx.strokeStyle = "#7aa2d8";
  ctx.lineWidth = 2;
  roundedRect(ctx, cx - 104, cy - 96, 208, 192, 24);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#0a111b";
  roundedRect(ctx, cx - 58, cy - 42, 116, 86, 12);
  ctx.fill();
  ctx.fillStyle = "#7adfc1";
  ctx.beginPath();
  ctx.arc(cx - 34, cy - 12, 10, 0, Math.PI * 2);
  ctx.arc(cx + 34, cy - 12, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#e1c35c";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 40, cy + 28);
  ctx.quadraticCurveTo(cx, cy + 48, cx + 40, cy + 28);
  ctx.stroke();
  ctx.fillStyle = "#202733";
  ctx.font = "700 16px Segoe UI, Microsoft YaHei, sans-serif";
  ctx.fillText(state.model?.name || "model", 42, 62);
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
  maskCtx.clearRect(0, 0, ui.sourceCanvas.clientWidth, ui.sourceCanvas.clientHeight);
  state.strokes.forEach((stroke) => drawStrokeOnContext(maskCtx, stroke));
}

function drawMaskOverlay(ctx, w, h) {
  if (!state.strokes.length) return;
  fxCtx.clearRect(0, 0, w, h);
  fxCtx.fillStyle = "rgba(54, 226, 202, .38)";
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

function strokeBounds(stroke) {
  if (!stroke) return null;
  if (stroke.kind === "rect") {
    return {
      x: Math.min(stroke.start.x, stroke.end.x),
      y: Math.min(stroke.start.y, stroke.end.y),
      w: Math.abs(stroke.end.x - stroke.start.x),
      h: Math.abs(stroke.end.y - stroke.start.y),
    };
  }
  if (stroke.kind === "circle") {
    const dx = stroke.end.x - stroke.start.x;
    const dy = stroke.end.y - stroke.start.y;
    const r = Math.max(4, Math.sqrt(dx * dx + dy * dy));
    return { x: stroke.start.x - r, y: stroke.start.y - r, w: r * 2, h: r * 2 };
  }
  const points = stroke.points || [];
  if (!points.length) return null;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const pad = Math.max(10, stroke.size / 2);
  return {
    x: Math.min(...xs) - pad,
    y: Math.min(...ys) - pad,
    w: Math.max(...xs) - Math.min(...xs) + pad * 2,
    h: Math.max(...ys) - Math.min(...ys) + pad * 2,
  };
}

function selectedStroke() {
  return state.strokes[state.selectedStrokeIndex] || null;
}

function cloneStroke(stroke) {
  return JSON.parse(JSON.stringify(stroke));
}

function transformPoint(point, bounds, target) {
  const safeW = Math.max(1, bounds.w);
  const safeH = Math.max(1, bounds.h);
  return {
    x: target.x + ((point.x - bounds.x) / safeW) * target.w,
    y: target.y + ((point.y - bounds.y) / safeH) * target.h,
  };
}

function transformStroke(stroke, transform) {
  if (!stroke) return;
  if (stroke.points) stroke.points = stroke.points.map(transform);
  if (stroke.start) stroke.start = transform(stroke.start);
  if (stroke.end) stroke.end = transform(stroke.end);
}

function scaleStrokeToBounds(stroke, fromBounds, toBounds) {
  if (!stroke || !fromBounds || !toBounds) return;
  const target = {
    x: Math.min(toBounds.x, toBounds.x + toBounds.w),
    y: Math.min(toBounds.y, toBounds.y + toBounds.h),
    w: Math.max(1, Math.abs(toBounds.w)),
    h: Math.max(1, Math.abs(toBounds.h)),
  };
  transformStroke(stroke, (point) => transformPoint(point, fromBounds, target));
}

function selectedHandleAt(point) {
  const bounds = strokeBounds(selectedStroke());
  if (!bounds) return "";
  const handles = {
    nw: { x: bounds.x, y: bounds.y },
    ne: { x: bounds.x + bounds.w, y: bounds.y },
    se: { x: bounds.x + bounds.w, y: bounds.y + bounds.h },
    sw: { x: bounds.x, y: bounds.y + bounds.h },
  };
  const hit = 12;
  return Object.entries(handles).find(([, handle]) => Math.abs(point.x - handle.x) <= hit && Math.abs(point.y - handle.y) <= hit)?.[0] || "";
}

function boundsFromHandle(handle, original, point) {
  const left = handle.includes("w") ? point.x : original.x;
  const right = handle.includes("e") ? point.x : original.x + original.w;
  const top = handle.includes("n") ? point.y : original.y;
  const bottom = handle.includes("s") ? point.y : original.y + original.h;
  return {
    x: Math.min(left, right),
    y: Math.min(top, bottom),
    w: Math.max(8, Math.abs(right - left)),
    h: Math.max(8, Math.abs(bottom - top)),
  };
}

function drawSelectedOverlay(ctx) {
  const stroke = selectedStroke();
  const bounds = strokeBounds(stroke);
  if (!bounds) return;
  ctx.save();
  ctx.setLineDash([6, 5]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = stroke.locked ? "#d6b870" : "#07100d";
  ctx.fillStyle = stroke.locked ? "rgba(214,184,112,.12)" : "rgba(7,16,13,.08)";
  if (stroke.kind === "circle") {
    const dx = stroke.end.x - stroke.start.x;
    const dy = stroke.end.y - stroke.start.y;
    ctx.beginPath();
    ctx.arc(stroke.start.x, stroke.start.y, Math.max(4, Math.sqrt(dx * dx + dy * dy)), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
    ctx.strokeRect(bounds.x, bounds.y, bounds.w, bounds.h);
  }
  ctx.setLineDash([]);
  ctx.fillStyle = "#f7f9fb";
  ctx.strokeStyle = "#07100d";
  ctx.lineWidth = 1.5;
  const handles = [
    [bounds.x, bounds.y],
    [bounds.x + bounds.w, bounds.y],
    [bounds.x + bounds.w, bounds.y + bounds.h],
    [bounds.x, bounds.y + bounds.h],
  ];
  handles.forEach(([x, y]) => {
    ctx.fillRect(x - 4, y - 4, 8, 8);
    ctx.strokeRect(x - 4, y - 4, 8, 8);
  });
  ctx.restore();
}

function drawSource() {
  const w = ui.sourceCanvas.clientWidth;
  const h = ui.sourceCanvas.clientHeight;
  sctx.clearRect(0, 0, w, h);

  if (state.image) {
    sctx.fillStyle = "#e7e8e3";
    sctx.fillRect(0, 0, w, h);
    const rect = imageRect(ui.sourceCanvas, state.image);
    sctx.drawImage(state.image, rect.x, rect.y, rect.w, rect.h);
    drawMaskOverlay(sctx, w, h);
    drawSelectedOverlay(sctx);
    drawDraft(sctx);
    return;
  }

  if (state.model) {
    drawModel(sctx, ui.sourceCanvas);
    drawMaskOverlay(sctx, w, h);
    drawSelectedOverlay(sctx);
    drawDraft(sctx);
    return;
  }

  placeholder(sctx, ui.sourceCanvas, tr("waiting"), tr("waitingText"));
}

function randomUnit(index) {
  const x = Math.sin((state.seed + index * 97) * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function drawPreviewEffect(ctx, w, h) {
  const amount = Number(ui.strength.value) / 100;
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
  ctx.fillStyle = "rgba(54,226,202,.12)";
  ctx.fillRect(0, 0, w, h);
}

function drawResult() {
  const w = ui.resultCanvas.clientWidth;
  const h = ui.resultCanvas.clientHeight;
  rctx.clearRect(0, 0, w, h);

  if (state.generatedImage) {
    rctx.fillStyle = "#dce0de";
    rctx.fillRect(0, 0, w, h);
    const rect = imageRect(ui.resultCanvas, state.generatedImage);
    rctx.drawImage(state.generatedImage, rect.x, rect.y, rect.w, rect.h);
    return;
  }

  if (state.image) {
    rctx.fillStyle = "#dce0de";
    rctx.fillRect(0, 0, w, h);
    const rect = imageRect(ui.resultCanvas, state.image);
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
    drawModel(rctx, ui.resultCanvas);
    if (state.strokes.length || state.lastRequest) drawPreviewEffect(rctx, w, h);
    return;
  }

  placeholder(rctx, ui.resultCanvas, tr("livePreview"), tr("livePreviewText"));
}

function draw() {
  ui.sourceEmpty.style.display = activeAsset() ? "none" : "grid";
  drawSource();
  drawResult();
}

function pushHistory(stroke) {
  if (!stroke) return;
  state.strokes.push(stroke);
  state.selectedStrokeIndex = state.strokes.length - 1;
  state.redoStack = [];
  redrawMaskBitmap();
}

function resetMask() {
  state.strokes = [];
  state.redoStack = [];
  state.draft = null;
  state.selectedStrokeIndex = -1;
  state.movingSelection = false;
  state.resizingSelection = false;
  state.resizeHandle = "";
  state.resizeOriginal = null;
  state.resizeBounds = null;
  state.moveLast = null;
  state.lastRequest = null;
  state.generatedImage = null;
  redrawMaskBitmap();
}

function setTool(tool) {
  state.tool = tool;
  if (tool !== "select") {
    state.movingSelection = false;
    state.resizingSelection = false;
  }
  ui.sourceCanvas.style.cursor = tool === "select" ? "grab" : "none";
  updateToolReadout();
  const hintKey = {
    select: "selectHint",
    brush: "brushHint",
    erase: "eraseHint",
    rect: "rectHint",
    circle: "circleHint",
  }[tool];
  setStatus(tool === "erase" ? "eraser" : tool, hintKey);
}

function distanceToSegment(point, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (dx === 0 && dy === 0) return Math.hypot(point.x - a.x, point.y - a.y);
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy));
}

function pointInStroke(point, stroke) {
  if (!stroke || stroke.mode === "erase") return false;
  if (stroke.kind === "rect") {
    const b = strokeBounds(stroke);
    return point.x >= b.x && point.x <= b.x + b.w && point.y >= b.y && point.y <= b.y + b.h;
  }
  if (stroke.kind === "circle") {
    const dx = point.x - stroke.start.x;
    const dy = point.y - stroke.start.y;
    const rx = stroke.end.x - stroke.start.x;
    const ry = stroke.end.y - stroke.start.y;
    return Math.hypot(dx, dy) <= Math.max(4, Math.hypot(rx, ry));
  }
  const points = stroke.points || [];
  const hitSize = Math.max(12, stroke.size / 2 + 6);
  for (let i = 1; i < points.length; i += 1) {
    if (distanceToSegment(point, points[i - 1], points[i]) <= hitSize) return true;
  }
  return points.length === 1 && Math.hypot(point.x - points[0].x, point.y - points[0].y) <= hitSize;
}

function findStrokeAt(point) {
  for (let index = state.strokes.length - 1; index >= 0; index -= 1) {
    if (pointInStroke(point, state.strokes[index])) return index;
  }
  return -1;
}

function translateStroke(stroke, dx, dy) {
  if (!stroke) return;
  if (stroke.points) stroke.points.forEach((point) => {
    point.x += dx;
    point.y += dy;
  });
  if (stroke.start) {
    stroke.start.x += dx;
    stroke.start.y += dy;
  }
  if (stroke.end) {
    stroke.end.x += dx;
    stroke.end.y += dy;
  }
}

function fitBoundsIntoCanvas(fill = false) {
  const stroke = selectedStroke();
  const bounds = strokeBounds(stroke);
  if (!stroke || !bounds) return;
  const margin = fill ? 22 : Math.min(ui.sourceCanvas.clientWidth, ui.sourceCanvas.clientHeight) * 0.16;
  const target = {
    x: margin,
    y: margin,
    w: Math.max(24, ui.sourceCanvas.clientWidth - margin * 2),
    h: Math.max(24, ui.sourceCanvas.clientHeight - margin * 2),
  };
  if (!fill) {
    const scale = Math.min(target.w / Math.max(1, bounds.w), target.h / Math.max(1, bounds.h));
    target.w = Math.max(24, bounds.w * scale);
    target.h = Math.max(24, bounds.h * scale);
    target.x = (ui.sourceCanvas.clientWidth - target.w) / 2;
    target.y = (ui.sourceCanvas.clientHeight - target.h) / 2;
  }
  scaleStrokeToBounds(stroke, bounds, target);
}

function commitLayerChange(reason = "layer") {
  state.generatedImage = null;
  state.redoStack = [];
  redrawMaskBitmap();
  draw();
  setStatus("layerChanged", "layerChangedText");
  scheduleRealtimeRender(reason);
}

function moveSelectedLayer(toIndex) {
  if (state.selectedStrokeIndex < 0) return;
  const nextIndex = Math.max(0, Math.min(state.strokes.length - 1, toIndex));
  if (nextIndex === state.selectedStrokeIndex) return;
  const [stroke] = state.strokes.splice(state.selectedStrokeIndex, 1);
  state.strokes.splice(nextIndex, 0, stroke);
  state.selectedStrokeIndex = nextIndex;
}

function applyLayerAction(action) {
  const stroke = selectedStroke();
  const bounds = strokeBounds(stroke);
  if (!stroke || !bounds) return;

  if (action === "lock") {
    stroke.locked = !stroke.locked;
  } else if (action === "front") {
    moveSelectedLayer(state.strokes.length - 1);
  } else if (action === "forward") {
    moveSelectedLayer(state.selectedStrokeIndex + 1);
  } else if (action === "backward") {
    moveSelectedLayer(state.selectedStrokeIndex - 1);
  } else if (action === "back") {
    moveSelectedLayer(0);
  } else if (action === "duplicate") {
    const duplicate = cloneStroke(stroke);
    translateStroke(duplicate, 26, 26);
    state.strokes.push(duplicate);
    state.selectedStrokeIndex = state.strokes.length - 1;
  } else if (action === "delete") {
    state.strokes.splice(state.selectedStrokeIndex, 1);
    state.selectedStrokeIndex = -1;
  } else if (action === "flipX") {
    transformStroke(stroke, (point) => ({ x: bounds.x + bounds.w - (point.x - bounds.x), y: point.y }));
  } else if (action === "flipY") {
    transformStroke(stroke, (point) => ({ x: point.x, y: bounds.y + bounds.h - (point.y - bounds.y) }));
  } else if (action === "fit") {
    fitBoundsIntoCanvas(false);
  } else if (action === "fill") {
    fitBoundsIntoCanvas(true);
  }

  hideLayerMenu();
  commitLayerChange(action);
}

function showLayerMenu(event) {
  if (!activeAsset()) return;
  event.preventDefault();
  const point = localPoint(event);
  const hit = findStrokeAt(point);
  if (hit >= 0) state.selectedStrokeIndex = hit;
  if (state.selectedStrokeIndex < 0) {
    hideLayerMenu();
    setStatus("noSelection", "noSelectionText");
    scheduleDraw();
    return;
  }

  const width = 190;
  const height = 336;
  const x = Math.min(window.innerWidth - width - 10, Math.max(10, event.clientX + 8));
  const y = Math.min(window.innerHeight - height - 10, Math.max(10, event.clientY + 8));
  ui.layerMenu.style.left = `${x}px`;
  ui.layerMenu.style.top = `${y}px`;
  ui.layerMenu.classList.add("open");
  ui.layerMenu.setAttribute("aria-hidden", "false");
  scheduleDraw();
}

function hideLayerMenu() {
  ui.layerMenu.classList.remove("open");
  ui.layerMenu.setAttribute("aria-hidden", "true");
}

function sourceDataUrl() {
  const canvas = document.createElement("canvas");
  const w = Math.max(1, Math.round(ui.sourceCanvas.clientWidth));
  const h = Math.max(1, Math.round(ui.sourceCanvas.clientHeight));
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  if (state.image) {
    ctx.fillStyle = "#e7e8e3";
    ctx.fillRect(0, 0, w, h);
    const rect = imageRect(ui.sourceCanvas, state.image);
    ctx.drawImage(state.image, rect.x, rect.y, rect.w, rect.h);
  } else if (state.model) {
    drawModel(ctx, { clientWidth: w, clientHeight: h });
  } else {
    ctx.fillStyle = "#e7e8e3";
    ctx.fillRect(0, 0, w, h);
  }

  return canvas.toDataURL("image/png");
}

function transparentPixelDataUrl() {
  return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";
}

function editMaskDataUrl() {
  const canvas = document.createElement("canvas");
  const w = Math.max(1, Math.round(ui.sourceCanvas.clientWidth));
  const h = Math.max(1, Math.round(ui.sourceCanvas.clientHeight));
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
  const isApiTest = reason === "api-test";
  if (!activeAsset() && !isApiTest) return;
  if (!state.strokes.length && reason !== "preview" && reason !== "example" && reason !== "api-test" && state.mode === "draw") return;

  const seq = state.renderSeq + 1;
  state.renderSeq = seq;
  if (state.renderController) state.renderController.abort();
  state.renderController = new AbortController();

  state.lastRequest = buildGenerationRequest({
    state: state.session,
    prompt: ui.promptBox.value,
    strokes: state.strokes,
    strength: Number(ui.strength.value),
    provider: ui.providerSelect.value,
    seed: state.seed,
    outputType: "image",
    mode: state.mode,
    aspectRatio: state.aspectRatio,
  });

  setApiState("busy", "rendering");
  setRequestState("busy", "rendering");
  const requestBody = {
    ...state.lastRequest,
    reason,
    sourceImageDataUrl: isApiTest ? transparentPixelDataUrl() : sourceDataUrl(),
    maskDataUrl: isApiTest ? transparentPixelDataUrl() : editMaskDataUrl(),
  };

  try {
    const response = await fetch("/api/realtime-render", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(requestBody),
      signal: state.renderController.signal,
    });
    const payload = await response.json();
    if (seq !== state.renderSeq) return;

    if (payload.imageDataUrl) {
      loadGeneratedImage(payload.imageDataUrl);
      setApiState("api", "apiOutput");
      setRequestState("api", "apiOutput");
      setStatus("outputUpdated", "outputUpdatedText");
      return;
    }

    state.generatedImage = null;
    draw();
    const isApi = payload.provider === "openai";
    const isError = payload.ok === false;
    setApiState(isError ? "error" : (isApi ? "api" : "local"), isError ? "apiMissing" : (isApi ? "apiOutput" : "localPreview"));
    setRequestState(isError ? "error" : "local", isError ? "apiMissing" : "idle");
    setStatus(isError ? "apiMissing" : "localPreview", isError ? "apiMissing" : "noKey", state.lang === "cn" ? payload.message_cn || tr("noKey") : payload.message_en || tr("noKey"));
  } catch (error) {
    if (error.name === "AbortError") return;
    if (ui.providerSelect.value === "custom-http") {
      try {
        const payload = await callDirectCustomApi(requestBody);
        if (seq !== state.renderSeq) return;
        const imageDataUrl = payload.imageDataUrl || (payload.b64_json ? `data:image/png;base64,${payload.b64_json}` : "");
        if (imageDataUrl) {
          loadGeneratedImage(imageDataUrl);
          setApiState("api", "apiOutput");
          setRequestState("api", "apiOutput");
          setStatus("outputUpdated", "outputUpdatedText", state.lang === "cn" ? payload.message_cn || payload.message || "" : payload.message_en || payload.message || "");
          return;
        }
        throw new Error(state.lang === "cn" ? "Custom API \u672a\u8fd4\u56de imageDataUrl \u6216 b64_json\u3002" : "Custom API did not return imageDataUrl or b64_json.");
      } catch (directError) {
        state.generatedImage = null;
        draw();
        setApiState("error", "apiError");
        setRequestState("error", "apiError");
        setStatus("apiError", "apiError", String(directError.message || directError));
        return;
      }
    }
    state.generatedImage = null;
    enterStaticDemoMode();
  }
}

function registerImage(file, img) {
  state.session = registerAsset(createSessionState(), {
    kind: "image",
    name: file.name,
    size: file.size,
    mime: file.type || "",
    width: img.naturalWidth || img.width,
    height: img.naturalHeight || img.height,
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
      source: "example",
    });
    ui.assetInfo.textContent = `${tr("imageLabel")}example-chair.png`;
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
    ui.assetInfo.textContent = `${tr("imageLabel")}${file.name} / ${fileSize(file.size)}`;
    setStatus("importedImage", "importedImageText");
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
    source: "browser",
  });
  ui.assetInfo.textContent = `${tr("modelLabel")}${file.name} / ${fileSize(file.size)}`;
  setStatus("importedModel", "importedModelText");
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
  setStatus("unsupported", "unsupportedText");
}

function beginStroke(e) {
  hideLayerMenu();
  updateBrushCursor(e);
  if (!activeAsset()) return;
  e.preventDefault();
  state.generatedImage = null;
  ui.sourceCanvas.setPointerCapture(e.pointerId);
  const p = localPoint(e);
  if (state.tool === "select") {
    const handle = selectedHandleAt(p);
    if (handle && selectedStroke() && !selectedStroke().locked) {
      state.resizingSelection = true;
      state.resizeHandle = handle;
      state.resizeOriginal = cloneStroke(selectedStroke());
      state.resizeBounds = strokeBounds(selectedStroke());
      ui.sourceCanvas.style.cursor = `${handle}-resize`;
      setStatus("selected", "selectedText");
      scheduleDraw();
      return;
    }
    state.selectedStrokeIndex = findStrokeAt(p);
    const stroke = selectedStroke();
    state.movingSelection = state.selectedStrokeIndex >= 0 && !stroke?.locked;
    state.moveLast = p;
    ui.sourceCanvas.style.cursor = state.movingSelection ? "grabbing" : "grab";
    setStatus(state.selectedStrokeIndex >= 0 ? "selected" : "noSelection", state.selectedStrokeIndex >= 0 ? "selectedText" : "noSelectionText");
    scheduleDraw();
    return;
  }

  state.drawing = true;
  if (state.tool === "brush" || state.tool === "erase") {
    pushHistory({
      kind: "path",
      mode: state.tool === "erase" ? "erase" : "brush",
      size: Number(ui.brushSize.value),
      points: [p],
    });
  } else {
    state.draft = {
      kind: state.tool === "rect" ? "rect" : "circle",
      mode: "brush",
      size: Number(ui.brushSize.value),
      start: p,
      end: p,
    };
  }
  redrawMaskBitmap();
  scheduleDraw();
}

function extendStroke(e) {
  updateBrushCursor(e);
  if (state.resizingSelection && state.selectedStrokeIndex >= 0) {
    e.preventDefault();
    const p = localPoint(e);
    const target = boundsFromHandle(state.resizeHandle, state.resizeBounds, p);
    state.strokes[state.selectedStrokeIndex] = cloneStroke(state.resizeOriginal);
    scaleStrokeToBounds(state.strokes[state.selectedStrokeIndex], state.resizeBounds, target);
    state.generatedImage = null;
    redrawMaskBitmap();
    scheduleDraw();
    return;
  }
  if (state.movingSelection && state.selectedStrokeIndex >= 0) {
    e.preventDefault();
    const p = localPoint(e);
    translateStroke(state.strokes[state.selectedStrokeIndex], p.x - state.moveLast.x, p.y - state.moveLast.y);
    state.moveLast = p;
    state.generatedImage = null;
    redrawMaskBitmap();
    scheduleDraw();
    return;
  }
  if (!state.drawing) return;
  e.preventDefault();
  const p = localPoint(e);
  if (state.draft) state.draft.end = p;
  else if (state.strokes.length) state.strokes[state.strokes.length - 1].points.push(p);
  redrawMaskBitmap();
  scheduleDraw();
}

function endStroke(e) {
  if (e && ui.sourceCanvas.hasPointerCapture?.(e.pointerId)) ui.sourceCanvas.releasePointerCapture(e.pointerId);
  let changed = false;
  if (state.resizingSelection) {
    state.resizingSelection = false;
    state.resizeHandle = "";
    state.resizeOriginal = null;
    state.resizeBounds = null;
    ui.sourceCanvas.style.cursor = "grab";
    redrawMaskBitmap();
    scheduleDraw();
    scheduleRealtimeRender("resize");
    return;
  }
  if (state.movingSelection) {
    state.movingSelection = false;
    ui.sourceCanvas.style.cursor = "grab";
    redrawMaskBitmap();
    scheduleDraw();
    scheduleRealtimeRender("move");
    return;
  }
  if (state.draft) {
    pushHistory(state.draft);
    state.draft = null;
    changed = true;
  }
  if (state.drawing) changed = true;
  state.drawing = false;
  redrawMaskBitmap();
  scheduleDraw();
  if (changed) scheduleRealtimeRender("stroke");
}

function updateBrushCursor(e) {
  if (state.tool === "select") {
    const point = localPoint(e);
    const handle = selectedHandleAt(point);
    ui.sourceCanvas.style.cursor = handle ? `${handle}-resize` : (findStrokeAt(point) >= 0 ? "grab" : "default");
    ui.brushCursor.style.opacity = "0";
    return;
  }
  const boardRect = ui.board.getBoundingClientRect();
  ui.brushCursor.style.left = `${e.clientX - boardRect.left}px`;
  ui.brushCursor.style.top = `${e.clientY - boardRect.top}px`;
  ui.brushCursor.style.opacity = activeAsset() && e.target === ui.sourceCanvas && state.tool !== "select" ? "1" : "0";
}

function updatePreview() {
  draw();
  scheduleRealtimeRender("preview");
  setStatus("previewQueued", "previewQueuedText");
}

function clearMask() {
  const hadMask = state.strokes.length > 0;
  resetMask();
  draw();
  setApiState("local", "localPreview");
  setStatus("maskCleared", hadMask ? "maskClearedText" : "nothingClear");
}

function undoMask() {
  const stroke = state.strokes.pop();
  if (!stroke) return;
  state.redoStack.push(stroke);
  state.selectedStrokeIndex = -1;
  state.generatedImage = null;
  redrawMaskBitmap();
  draw();
  setStatus("undo", "maskClearedText");
  scheduleRealtimeRender("undo");
}

function redoMask() {
  const stroke = state.redoStack.pop();
  if (!stroke) return;
  state.strokes.push(stroke);
  state.selectedStrokeIndex = state.strokes.length - 1;
  state.generatedImage = null;
  redrawMaskBitmap();
  draw();
  setStatus("redo", "previewQueuedText");
  scheduleRealtimeRender("redo");
}

function cycleAspectRatio() {
  state.aspectRatio = state.aspectRatio === "1:1" ? "16:9" : state.aspectRatio === "16:9" ? "4:5" : "1:1";
  updateChips();
  scheduleRealtimeRender("ratio");
}

function nextSeed() {
  state.seed = (state.seed * 9301 + 49297) % 233280;
  state.generatedImage = null;
  updateChips();
  draw();
  scheduleRealtimeRender("seed");
}

function syncBrushSize(value) {
  ui.brushSize.value = value;
  ui.brushSizeDock.value = value;
  updateToolReadout();
}

function syncStrength(value) {
  ui.strength.value = value;
  ui.strengthDock.value = value;
  state.generatedImage = null;
  draw();
}

async function checkApiStatus() {
  setApiState("busy", "checking");
  try {
    const response = await fetch("/api/status", { cache: "no-store" });
    const payload = await response.json();
    const configured = payload.openai_configured || payload.custom_api_configured;
    setApiState(configured ? "api" : "local", configured ? "apiOutput" : "localPreview");
    updateApiSummary(payload);
  } catch {
    enterStaticDemoMode();
  }
}

document.querySelectorAll("[data-tool]").forEach((button) => {
  button.addEventListener("click", () => setTool(button.dataset.tool));
});

$("clearBtn").addEventListener("click", clearMask);
$("undoBtn")?.addEventListener("click", undoMask);
$("redoBtn")?.addEventListener("click", redoMask);
$("previewBtn").addEventListener("click", updatePreview);
$("openApiSettingsBtn").addEventListener("click", () => openApiSettings());
$("testApiBtn").addEventListener("click", () => {
  testApiConnection("panel");
});
ui.closeApiSettingsBtn.addEventListener("click", closeApiSettings);
ui.apiModal.addEventListener("click", (event) => {
  if (event.target === ui.apiModal) closeApiSettings();
});
ui.apiOpenAiTab.addEventListener("click", () => {
  state.apiConfigTab = "openai";
  renderApiConfigForm();
});
ui.apiCustomTab.addEventListener("click", () => {
  state.apiConfigTab = "custom-http";
  renderApiConfigForm();
});
ui.saveApiSettingsBtn.addEventListener("click", () => {
  saveApiSettings().catch((error) => {
    ui.apiModalStatus.textContent = String(error.message || error);
  });
});
ui.modalTestApiBtn.addEventListener("click", () => {
  ui.providerSelect.value = state.apiConfigTab;
  testApiConnection("modal");
});
$("importImageBtn").addEventListener("click", () => ui.imageInput.click());
$("importImageNav").addEventListener("click", () => ui.imageInput.click());
$("importModelBtn").addEventListener("click", () => ui.modelInput.click());
$("importModelNav").addEventListener("click", () => ui.modelInput.click());
$("exampleNav").addEventListener("click", loadExampleAsset);
$("examplesChip").addEventListener("click", () => {
  ui.promptBox.value = tr("promptExample");
  ui.promptBox.dataset.custom = "1";
  loadExampleAsset();
  setStatus("exampleLoaded", "exampleLoadedText");
});

ui.imageInput.addEventListener("change", () => handleFile(ui.imageInput.files[0]));
ui.modelInput.addEventListener("change", () => handleFile(ui.modelInput.files[0]));

document.addEventListener("dragover", (e) => e.preventDefault());
document.addEventListener("drop", (e) => {
  e.preventDefault();
  handleFile(e.dataTransfer.files[0]);
});

ui.sourceCanvas.addEventListener("pointerdown", beginStroke);
ui.sourceCanvas.addEventListener("pointermove", extendStroke);
ui.sourceCanvas.addEventListener("pointerup", endStroke);
ui.sourceCanvas.addEventListener("pointercancel", endStroke);
ui.sourceCanvas.addEventListener("contextmenu", showLayerMenu);
ui.sourceCanvas.addEventListener("pointerenter", updateBrushCursor);
ui.sourceCanvas.addEventListener("pointerleave", () => {
  if (!state.drawing) {
    state.draft = null;
    scheduleDraw();
  }
  ui.brushCursor.style.opacity = "0";
});

document.querySelectorAll("[data-layer-action]").forEach((button) => {
  button.addEventListener("click", () => applyLayerAction(button.dataset.layerAction));
});

document.addEventListener("pointerdown", (event) => {
  if (!ui.layerMenu.classList.contains("open")) return;
  if (ui.layerMenu.contains(event.target)) return;
  hideLayerMenu();
});

ui.brushSize.addEventListener("input", () => syncBrushSize(ui.brushSize.value));
ui.brushSizeDock.addEventListener("input", () => syncBrushSize(ui.brushSizeDock.value));
ui.strength.addEventListener("input", () => {
  syncStrength(ui.strength.value);
  scheduleRealtimeRender("strength");
});
ui.strengthDock.addEventListener("input", () => {
  syncStrength(ui.strengthDock.value);
  scheduleRealtimeRender("strength");
});

ui.drawModeChip.addEventListener("click", () => {
  state.mode = state.mode === "draw" ? "text" : "draw";
  updateChips();
  scheduleRealtimeRender("mode");
});
ui.aspectRatioChip.addEventListener("click", cycleAspectRatio);
ui.seedChip.addEventListener("click", nextSeed);
ui.liveChip.addEventListener("click", () => {
  state.liveEnabled = !state.liveEnabled;
  updateChips();
  setStatus(state.liveEnabled ? "liveOn" : "liveOff", state.liveEnabled ? "liveOnText" : "liveOffText");
  if (state.liveEnabled) scheduleRealtimeRender("live");
});
ui.providerSelect.addEventListener("change", () => scheduleRealtimeRender("provider"));
ui.promptBox.addEventListener("input", () => {
  ui.promptBox.dataset.custom = "1";
  scheduleRealtimeRender("prompt");
});

document.querySelectorAll(".lang button").forEach((button) => {
  button.addEventListener("click", () => {
    state.lang = button.dataset.lang;
    document.querySelectorAll(".lang button").forEach((node) => node.classList.toggle("active", node === button));
    updateI18n();
  });
});

document.addEventListener("keydown", (e) => {
  if (e.target && /textarea|input|select/i.test(e.target.tagName)) return;
  const key = e.key.toLowerCase();
  if (key === "v") setTool("select");
  if (key === "b") setTool("brush");
  if (key === "e") setTool("erase");
  if (key === "r") setTool("rect");
  if (key === "c") setTool("circle");
  if (key === "delete" || key === "backspace") applyLayerAction("delete");
  if (e.ctrlKey && e.shiftKey && key === "z") redoMask();
  else if (e.ctrlKey && key === "z") undoMask();
  else if (e.ctrlKey && key === "y") redoMask();
  if (key === "[") syncBrushSize(Math.max(8, Number(ui.brushSize.value) - 4));
  if (key === "]") syncBrushSize(Math.min(120, Number(ui.brushSize.value) + 4));
});

window.addEventListener("resize", fitAll);

syncBrushSize(ui.brushSize.value);
syncStrength(ui.strength.value);
setTool("brush");
updateI18n();
fitAll();
checkApiStatus();
window.__DCC_CAPTURE_READY = true;

