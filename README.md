# DCC Capture Bridge

Realtime DCC-to-AI capture canvas for 3ds Max / Blender evidence.

The project started as a 3ds Max capture plugin, but the active direction is now a Krea-style realtime edit loop:

```text
DCC evidence / sketch / viewport
-> editable canvas and mask
-> realtime preview
-> API or local generation backend
```

## Current Prototype

Run the local canvas:

```powershell
node serve-static.mjs
```

Open:

```text
http://127.0.0.1:8765/capture-canvas/index.html
```

## Realtime API

The browser never stores an API key. The local Node server exposes:

- `GET /api/status`
- `POST /api/realtime-render`

Enable OpenAI image editing by starting the server with:

```powershell
$env:OPENAI_API_KEY="YOUR_KEY"
$env:OPENAI_IMAGE_MODEL="gpt-image-1.5"
node serve-static.mjs
```

Without `OPENAI_API_KEY`, the UI stays in local preview mode and clearly says so.

## Product Direction

- Keep the frontend as a clean realtime editing canvas.
- Keep API/ComfyUI/Blender integrations behind replaceable adapters.
- Do not fake AI output when no backend is configured.
- Keep Chinese and English UI modes separate.
- Preserve DCC evidence: shape, material boundaries, camera angle, and masks.

## 3ds Max MVP

The older drag-and-drop 3ds Max MVP still exists under:

```text
dist/PerfectHDScreenshotPro_MVP.ms
```

That path remains useful for capture-pack testing, but the main product direction is now the realtime DCC Capture Canvas.
