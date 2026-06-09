import { readFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
const inlineScripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
const moduleScriptSrcs = [...html.matchAll(/<script\s+type="module"\s+src="([^"]+)"/g)].map((match) => match[1]);
const app = readFileSync(new URL("./app.mjs", import.meta.url), "utf8");
const core = readFileSync(new URL("./capture-core.mjs", import.meta.url), "utf8");
const localServer = readFileSync(new URL("./serve-static.mjs", import.meta.url), "utf8");
const packageServer = readFileSync(new URL("../serve-static.mjs", import.meta.url), "utf8");

for (const script of inlineScripts) {
  new vm.Script(script);
}

new vm.Script(app.replace(/^import .*$/m, ""));
new vm.Script(core.replace(/export\s+/g, ""));

const visibleDefaultText = [...html.matchAll(/>([^<>]+)</g)]
  .map((match) => match[1].trim())
  .filter(Boolean)
  .join(" ");

const mojibakePattern = /[鐢鎹浜璇诲竷搧绛瀵鍥鎴杈閻㈤幑娴滅拠粵]/;
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
  "previewBtn"
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
  hasApiStatus: html.includes('id="apiState"') && localServer.includes("/api/status"),
  hasLiveChip: html.includes('id="liveChip"') && app.includes("liveEnabled"),
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
