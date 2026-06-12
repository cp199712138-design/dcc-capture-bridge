# Instant Canvas

Realtime edit prototype for DCC evidence. The current build focuses on the Krea-style loop:

- left canvas: sketch/reference/model evidence and mask drawing
- right canvas: realtime output preview
- bottom prompt: prompt, seed, ratio, draw/text mode, live toggle
- local API proxy: browser sends source image + mask to `/api/realtime-render`
- select mode: move and resize regions with handles
- right-click region menu: lock, order, duplicate, delete, flip, fit, fill

## Run

From the project root:

```powershell
node serve-static.mjs
```

Open:

```text
http://127.0.0.1:8765/capture-canvas/index.html
```

## Enable API Output

Set an API key before starting the server:

```powershell
$env:OPENAI_API_KEY="YOUR_KEY"
$env:OPENAI_IMAGE_MODEL="gpt-image-2"
node serve-static.mjs
```

Without `OPENAI_API_KEY`, the page stays honest and uses local preview mode.

The API contract is intentionally simple for client testing:

- `GET /api/status` returns whether the local server has an API key.
- `POST /api/test-provider` checks the selected remote provider without requiring a canvas.
- `POST /api/realtime-render` accepts prompt, source image data URL, mask data URL,
  seed, ratio, strength, mode, and provider.
- If the server has no key, the response is a local preview message.
- If the server has `OPENAI_API_KEY`, the same endpoint calls the image edit API.

## Test

```powershell
node check-page.mjs
node simulate-flow.mjs
node test-api-contract.mjs
node browser-smoke.mjs
```

`browser-smoke.mjs` uses a temporary extension-free Chrome profile, so it avoids
local browser extension blocks such as `ERR_BLOCKED_BY_CLIENT`.

## GitHub Visibility

To make the repo public:

1. Open the repository on GitHub.
2. Go to `Settings`.
3. Scroll to `Danger Zone`.
4. Choose `Change repository visibility`.
5. Select `Make public`.
6. Complete GitHub's access confirmation and type the repository name if prompted.

