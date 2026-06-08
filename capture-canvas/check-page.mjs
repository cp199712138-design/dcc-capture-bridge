import { readFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]);

for (const script of scripts) {
  new vm.Script(script);
}

console.log(JSON.stringify({
  scripts_ok: scripts.length,
  hasImageImport: html.includes('id="importBtn"'),
  hasModelImport: html.includes('id="importModelBtn"'),
  hasModelInput: html.includes('id="modelInput"'),
  hasChinese: html.includes("产品证据画布"),
  hasMojibake: /[鐢鎹浜璇诲竷搧]/.test(html)
}));
