import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

if (process.argv.includes("--all")) {
  runAllChecks();
  process.exit(0);
}

const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
const inlineScripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
const moduleScriptSrcs = [...html.matchAll(/<script\s+type="module"\s+src="([^"]+)"/g)].map((match) => match[1]);
const app = readFileSync(new URL("./app.mjs", import.meta.url), "utf8");
const core = readFileSync(new URL("./capture-core.mjs", import.meta.url), "utf8");
const localServer = readFileSync(new URL("./serve-static.mjs", import.meta.url), "utf8");
const packageServer = readFileSync(new URL("../serve-static.mjs", import.meta.url), "utf8");
const modelViewerUrl = new URL("./model-viewer.mjs", import.meta.url);
const modelViewer = existsSync(modelViewerUrl) ? readFileSync(modelViewerUrl, "utf8") : "";
const envExampleUrl = new URL("../.env.example", import.meta.url);
const envExample = existsSync(envExampleUrl) ? readFileSync(envExampleUrl, "utf8") : "";

for (const script of inlineScripts) {
  new vm.Script(script);
}

new vm.Script(app.replace(/^import .*$/gm, ""));
new vm.Script(core.replace(/export\s+/g, ""));

const visibleDefaultText = [...html.matchAll(/>([^<>]+)</g)]
  .map((match) => match[1].trim())
  .filter(Boolean)
  .join(" ");

const mojibakePattern = /[鐢鎹浜璇诲竷搧绛瀵鍥鎴杈閻㈤幑娴滅拠粵鈻鈬鈱猝]/;
const mixedChineseEnglishLabels = /Brush\s+(画笔|橡皮)|Eraser\s+橡皮|Output\s+(输出|预览)|Prompt\s+(提示|文本)|Image\s+图像|Seed\s+种子|Examples\s+示例/;

const requiredIds = [
  "sourceCanvas",
  "resultCanvas",
  "selectTool",
  "brushChip",
  "eraserChip",
  "rectTool",
  "circleTool",
  "brushBtn",
  "eraseBtn",
  "rectBtn",
  "circleBtn",
  "undoBtn",
  "redoBtn",
  "clearBtn",
  "importImageBtn",
  "importModelBtn",
  "examplesChip",
  "seedChip",
  "previewBtn",
  "layerMenu",
  "openApiSettingsBtn",
  "apiModal",
  "apiBaseUrlInput",
  "apiKeyInput",
  "saveApiSettingsBtn",
  "modalTestApiBtn"
];

const report = {
  scriptsOk: inlineScripts.length + moduleScriptSrcs.length,
  hasModuleScript: moduleScriptSrcs.includes("./app.mjs"),
  hasCoreContract: core.includes("buildGenerationRequest") && core.includes("chooseProvider"),
  hasMjsMime: localServer.includes('".mjs": "text/javascript; charset=utf-8"') && packageServer.includes('".mjs": "text/javascript; charset=utf-8"'),
  hasRequiredControls: requiredIds.every((id) => html.includes(`id="${id}"`)),
  hasPointerTools: app.includes('setTool(button.dataset.tool)') && app.includes('state.tool === "rect"') && app.includes('state.tool === "circle"'),
  hasBoardRelativeBrushCursor: app.includes("board.getBoundingClientRect()") && app.includes("e.clientX - boardRect.left") && app.includes("e.clientY - boardRect.top"),
  hasExampleCanvas: app.includes("loadExampleAsset") && app.includes("example-chair.png"),
  hasSeedAndRatio: app.includes("nextSeed") && app.includes("cycleAspectRatio"),
  hasRealtimeApiClient: app.includes("/api/realtime-render") && app.includes("scheduleRealtimeRender") && app.includes("sourceImageDataUrl") && app.includes("maskDataUrl"),
  hasRealtimeApiServer: localServer.includes("/api/realtime-render") && localServer.includes("OPENAI_API_KEY") && packageServer.includes("/api/realtime-render"),
  hasProviderTestEndpoint: app.includes("/api/test-provider") && localServer.includes("/api/test-provider") && packageServer.includes("/api/test-provider"),
  hasStaticDemoFallback: app.includes("STATIC_API_CONFIG_KEY") && app.includes("enterStaticDemoMode") && app.includes("callDirectCustomApi"),
  hasCustomApiAdapter: html.includes('value="custom-http"') && localServer.includes("DCC_CUSTOM_API_URL") && packageServer.includes("DCC_CUSTOM_API_URL"),
  hasApiTestUi: html.includes('id="apiSummary"') && html.includes('id="testApiBtn"') && app.includes('reason === "api-test"'),
  hasApiSettingsUi: html.includes('id="apiModal"') && app.includes("saveApiSettings") && app.includes("/api/config") && app.includes("openApiSettings"),
  hasEnvLoader: localServer.includes("loadLocalEnv") && packageServer.includes("loadLocalEnv") && localServer.includes('join(root, ".env")'),
  hasExplicitMissingProvider: localServer.includes("openai-missing") && localServer.includes("custom-http-missing") && packageServer.includes("openai-missing"),
  hasMovableSelection: app.includes("findStrokeAt") && app.includes("translateStroke") && app.includes("movingSelection") && app.includes("drawSelectedOverlay"),
  hasLayerMenuActions: html.includes('data-layer-action="duplicate"') && html.includes('data-layer-action="flipX"') && app.includes("applyLayerAction") && app.includes("showLayerMenu"),
  hasResizableSelection: app.includes("selectedHandleAt") && app.includes("scaleStrokeToBounds") && app.includes("resizingSelection"),
  hasApiStatus: html.includes('id="apiState"') && localServer.includes("/api/status"),
  hasLiveChip: html.includes('id="liveChip"') && app.includes("liveEnabled"),
  hasModelViewerModule: Boolean(modelViewer) && modelViewer.includes("export async function parseModelFile") && modelViewer.includes("export function createModelViewer"),
  hasReal3DPreviewIntegration: app.includes('from "./model-viewer.mjs"') && app.includes("createModelViewer") && app.includes("parseModelFile(file)") && app.includes("modelViewer.snapshot"),
  hasObjStlModelImport: html.includes('accept=".obj,.stl"') && app.includes('["obj", "stl"].includes(ext)'),
  hasSecretPlaceholderGuidance: html.includes('placeholder="sk-..."') && envExample.includes("OPENAI_API_KEY="),
  hasNoRealApiKeys: findRealApiKeys().length === 0,
  hasNoVideoPlaceholder: !html.includes("outputVideoChip") && !app.includes("Video mode"),
  hasChineseDefault: app.includes('lang: "cn"') && app.includes("\\u753b\\u7b14") && html.includes('class="active" data-lang="cn"'),
  hasMojibake: mojibakePattern.test(html) || mojibakePattern.test(app),
  hasMixedDefaultLabels: mixedChineseEnglishLabels.test(visibleDefaultText),
};

console.log(JSON.stringify(report));

const failed = Object.entries(report).filter(([key, value]) => {
  if (key === "hasMojibake" || key === "hasMixedDefaultLabels") return value;
  return !value;
});

if (failed.length) {
  console.error("Failed checks: " + failed.map(([key]) => key).join(", "));
  process.exit(1);
}

function findRealApiKeys() {
  const sources = [
    ["capture-canvas/index.html", html],
    ["capture-canvas/app.mjs", app],
    ["capture-canvas/serve-static.mjs", localServer],
    ["serve-static.mjs", packageServer],
    [".env.example", envExample],
  ];
  const realKeyPattern = /sk-(?!\.{3})(?!test\b)(?:proj-)?[A-Za-z0-9_-]{20,}/g;
  return sources.flatMap(([file, text]) => [...text.matchAll(realKeyPattern)].map((match) => ({ file, keyPrefix: match[0].slice(0, 8) })));
}

function runAllChecks() {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const commands = [
    ["node", ["capture-canvas/check-page.mjs"]],
    ["node", ["capture-canvas/simulate-flow.mjs"]],
    ["node", ["capture-canvas/test-api-contract.mjs"]],
    ["node", ["capture-canvas/browser-smoke.mjs"]],
  ];

  for (const [label, args] of commands) {
    const commandText = [label, ...args].join(" ");
    console.log(`\n> ${commandText}`);
    const result = spawnSync(process.execPath, args, {
      cwd: root,
      stdio: "inherit",
      env: process.env,
    });
    if (result.status !== 0) {
      process.exit(result.status || 1);
    }
  }

  console.log(JSON.stringify({ all_checks_ok: true, commands: commands.length }));
}
