# DCC Capture Canvas

Realtime edit prototype for DCC evidence. The current build focuses on the Krea-style loop:

- left canvas: sketch/reference/model evidence and mask drawing
- right canvas: realtime output preview
- bottom prompt: prompt, seed, ratio, draw/text mode, live toggle
- local API proxy: browser sends source image + mask to `/api/realtime-render`

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
$env:OPENAI_IMAGE_MODEL="gpt-image-1.5"
node serve-static.mjs
```

Without `OPENAI_API_KEY`, the page stays honest and uses local preview mode.

## GitHub Visibility

To make the repo public:

1. Open the repository on GitHub.
2. Go to `Settings`.
3. Scroll to `Danger Zone`.
4. Choose `Change repository visibility`.
5. Select `Make public`.
6. Complete GitHub's access confirmation and type the repository name if prompted.
