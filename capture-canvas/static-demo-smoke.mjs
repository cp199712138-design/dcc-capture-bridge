import { createServer } from "node:http";
import { createReadStream, existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { spawn } from "node:child_process";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const port = Number(process.env.DCC_STATIC_TEST_PORT || 9881);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

const server = createServer((req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
  if (url.pathname.startsWith("/api/")) {
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: false, message: "No API in static demo" }));
    return;
  }
  const requested = url.pathname === "/" ? "/capture-canvas/index.html" : url.pathname;
  const file = normalize(join(root, decodeURIComponent(requested)));
  if (!file.startsWith(normalize(root)) || !existsSync(file)) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("not found");
    return;
  }
  res.writeHead(200, { "content-type": mime[extname(file).toLowerCase()] || "application/octet-stream" });
  createReadStream(file).pipe(res);
});

await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));

try {
  const child = spawn(process.execPath, ["capture-canvas/browser-smoke.mjs"], {
    cwd: root,
    env: {
      ...process.env,
      DCC_CANVAS_TEST_URL: `http://127.0.0.1:${port}/capture-canvas/index.html`,
      DCC_CANVAS_TEST_PORT: String(port + 1),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => { stdout += chunk; });
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  const code = await new Promise((resolve) => child.on("exit", resolve));
  if (code !== 0) {
    throw new Error(`${stdout}\n${stderr}`.trim());
  }
  console.log(JSON.stringify({ static_demo_smoke_ok: true, browser: JSON.parse(stdout.trim()) }));
} finally {
  server.close();
}
