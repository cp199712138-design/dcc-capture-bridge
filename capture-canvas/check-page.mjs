import { readFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]);

for (const script of scripts) {
  new vm.Script(script);
}

console.log(JSON.stringify({
  scripts_ok: scripts.length,
  hasImport: html.includes('id="importBtn"'),
  hasFile: html.includes('id="fileInput"'),
  hasChinese: html.includes("实时产品证据画布"),
  hasMojibake: /[鐢鎹�]/.test(html)
}));
