# DCC Adapter Architecture

This project must not be tied to one 3ds Max rollout or one MAXScript file.

The stable product boundary is a **capture session**, not a screenshot button.

```text
UI
  -> Core Capture Service
      -> DCC Adapter
          -> 3ds Max / Blender / future DCC
      -> Output Session Writer
      -> AI Integration Adapter
          -> ComfyUI / future image API
```

## Layers

### UI Layer

Examples:

- 3ds Max MAXScript rollout
- 3ds Max .NET/WPF panel
- Blender Python panel
- Future canvas / webview UI

Rules:

- Reads user intent.
- Shows status.
- Calls the core service.
- Does not save bitmaps directly.
- Does not know ComfyUI node IDs.

### Core Capture Service

Rules:

- Builds a capture request.
- Asks the active DCC adapter for assets.
- Writes a capture session folder.
- Writes metadata using the shared schema.
- Returns structured success/failure results.

The core must not call `viewport.getViewportDib`, `bpy.ops`, or any software-specific API directly.

### DCC Adapter

Each DCC adapter implements the same capability set.

Minimum adapter methods:

```text
getDccInfo()
getViewportInfo()
captureViewportAsset(request)
renderBeautyAsset(request)
listCameras()
captureControlPass(request)
```

3ds Max implements these with MAXScript APIs.

Blender will implement these with `bpy`.

Future tools can implement the same contract without changing the core.

### Output Session Writer

Writes the stable folder shape:

```text
<output>/<session-id>/
  capture/
    viewport.png
  control/
  ai/
  metadata.json
  metadata.txt
```

The current MVP writes `metadata.txt` first because it is easy to inspect in Windows and 3ds Max. `metadata.json` is the next step.

### AI Integration Adapter

ComfyUI should be treated as a backend.

Rules:

- Call ComfyUI API.
- Upload capture assets.
- Fill versioned workflow templates.
- Save AI results back into the session folder.
- Do not recreate a node editor inside 3ds Max or Blender.

## Why This Matters

If the project stays as a single MaxScript UI, every new feature will make the file larger and harder to move.

With the adapter boundary:

- 3ds Max can stay a drag-and-drop MVP.
- Blender can reuse the same session schema.
- ComfyUI can be added without rewriting the DCC UI.
- A future modern UI can replace the rollout without replacing capture logic.

## Current MVP Position

The current `dist/PerfectHDScreenshotPro_MVP.ms` is a release artifact.

It is allowed to be one file for drag-and-drop testing, but the architecture direction is:

```text
src/contracts
src/core
src/adapters/3dsmax
src/adapters/blender
src/integrations/comfyui
src/ui/3dsmax
dist
```

The next engineering step is to make `dist/` generated from `src/`, not manually maintained forever.
