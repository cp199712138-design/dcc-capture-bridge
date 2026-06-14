# Instant Canvas

Realtime DCC-to-AI capture canvas for 3ds Max / Blender evidence.

The project started as a 3ds Max capture plugin, but the active direction is now a Krea-style realtime edit loop:

```text
DCC evidence / sketch / viewport
-> editable canvas and mask
-> realtime preview
-> API or local generation backend
```

## Current Prototype

Customer-testable features in this build:

- dark low-saturation realtime canvas UI
- Chinese / English language switch without mixed labels
- import image or model evidence
- example sketch loader
- brush, eraser, rectangle, circle, clear, undo, redo
- prompt, live toggle, seed, ratio, strength, provider selector
- local `/api/realtime-render` interface for future API and ComfyUI adapters
- selectable, movable, resizable mask regions in Select mode
- right-click layer menu: lock, ordering, duplicate, delete, flip, fit, fill
- API Settings panel for OpenAI-compatible and custom HTTP image providers

Run the local canvas:

```powershell
copy .env.example .env
node serve-static.mjs
```

Open:

```text
http://127.0.0.1:8765/capture-canvas/index.html
```

## Realtime API

The browser never stores an API key. The local Node server exposes:

- `GET /api/status`
- `POST /api/test-provider`
- `POST /api/realtime-render`

The UI includes an API status panel and a `Test API` button. If OpenAI or
Custom API is selected but missing configuration, the page shows the missing
`.env` setting instead of silently falling back to local preview.

The UI also includes an `API Settings` panel. It can save provider base URL,
model name, and API key into a local `.env` file. Saved keys are never returned
to the browser; the page only shows whether a key exists.

Enable OpenAI image editing by starting the server with:

```powershell
$env:OPENAI_API_KEY="YOUR_KEY"
$env:OPENAI_BASE_URL="https://api.openai.com/v1"
$env:OPENAI_IMAGE_MODEL="gpt-image-1"
node serve-static.mjs
```

Without `OPENAI_API_KEY`, the UI stays in local preview mode and clearly says so.
For OpenAI-compatible proxies, `OPENAI_BASE_URL` must point at the API root,
for example `https://your-host/v1`, not the browser website root.

Keep real keys in the shell or a local `.env` file only. Do not commit `.env`,
customer images, model files, renders, captures, or generated materials.

## Customer API Adapter

Customers can bring their own image API without changing the browser code:

```powershell
$env:DCC_CUSTOM_API_URL="https://your-api.example.com/render"
$env:DCC_CUSTOM_API_KEY="YOUR_CUSTOM_KEY"
$env:DCC_CUSTOM_API_MODEL="YOUR_IMAGE_MODEL"
$env:DCC_CUSTOM_API_AUTH_HEADER="authorization"
$env:DCC_CUSTOM_API_AUTH_SCHEME="Bearer"
node serve-static.mjs
```

The local server sends JSON containing `prompt`, `sourceImageDataUrl`,
`maskDataUrl`, `assets`, `mask`, `output`, `strength`, and `reason`.

Accepted response shapes:

```json
{ "imageDataUrl": "data:image/png;base64,..." }
```

or:

```json
{ "b64_json": "..." }
```

Full request and response details are in `docs/API_ADAPTER.md`.

## Public Static Demo

The canvas can be deployed as a static page for customer testing. In static
demo mode:

- the UI, import, drawing, selection, transform, prompt, and local preview work
- customers can configure `Custom API` in the API Settings panel
- Custom API settings are stored only in that customer's browser `localStorage`
- the customer API must allow browser CORS requests
- OpenAI keys should use the local/hosted server proxy, not direct browser calls

Static demo is for trying the product flow. Full production use should run a
server proxy so provider keys are not exposed to the browser.

## Verify Before Shipping

Run the smoke checks from the project root:

```powershell
node capture-canvas/check-page.mjs
node capture-canvas/simulate-flow.mjs
node capture-canvas/test-api-contract.mjs
node capture-canvas/browser-smoke.mjs
```

`browser-smoke.mjs` launches a clean headless Chrome profile with extensions
disabled, loads the canvas, clicks the example, draws a region, opens the
right-click layer menu, and duplicates the selected region.

## Product Direction

- Keep the frontend as a clean realtime editing canvas.
- Keep API/ComfyUI/Blender integrations behind replaceable adapters.
- Do not fake AI output when no backend is configured.
- Keep Chinese and English UI modes separate.
- Preserve DCC evidence: shape, material boundaries, camera angle, and masks.

## Development Modules

Work is split by module so each coding pass can load only the relevant context:

- `development/README.md`
- `development/01-ui-shell/`
- `development/02-canvas-editor/`
- `development/03-realtime-api/`
- `development/04-dcc-adapters/`
- `development/05-ai-backends/`
- `development/06-testing-release/`

## Local Handoff Split

This checkout also includes the responsibility folders requested for local handoff:

- `UI`: front-end interface and interaction notes
- `Canvas`: preview canvas and image processing notes
- `API`: shared parameter and adapter contract notes
- `3ds Max`: 3ds Max-side package work
- `Blender`: Blender-side package notes
- `测试发布`: install, uninstall, test, packaging, and release scripts

The first local 3ds Max package is under:

```text
3ds Max/HDViewportCapture.bundle
```

Install or remove it with:

```powershell
.\测试发布\install-3dsmax.ps1
.\测试发布\uninstall-3dsmax.ps1
```

## 3ds Max MVP

The older drag-and-drop 3ds Max MVP still exists under:

```text
dist/PerfectHDScreenshotPro_MVP.ms
```

That path remains useful for capture-pack testing, but the main product direction is now the realtime Instant Canvas.
