import { readFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]);

for (const script of scripts) {
  new vm.Script(script);
}

console.log(JSON.stringify({
  scripts_ok: scripts.length,
  hasImageImport: html.includes('id="imageInput"') && html.includes('id="importImageBtn"'),
  hasModelImport: html.includes('id="importModelBtn"'),
  hasModelInput: html.includes('id="modelInput"'),
  hasChinese: html.includes("导入图片") && html.includes("实时画布"),
  hasMojibake: /[鐢鎹浜璇诲竷搧绛瀵鍥鎴杈]/.test(html)
}));
