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

### 3ds Max Truth Boundary

The 3ds Max adapter must never blur these concepts:

- Viewport pixel capture reads the active viewport pixels. It is fast and useful
  as Instant Canvas evidence, but it is limited by the actual viewport raster.
- Renderer output uses the active 3ds Max renderer and Render Setup at the
  requested output size. This is the only path that can claim true
  high-resolution render output.

If a viewport bitmap is resized, the output is still `viewport_pixel_capture`;
the metadata must say it was resized and must not call it renderer quality.

## Evidence Packet Contract

The adapter output is an evidence packet for the canvas/API, not just an image.
Every DCC adapter must describe the user's intent in a shared shape.

Minimum metadata fields:

```text
packet:
  packetVersion: instant_canvas.dcc_evidence.v1
  captureFamily: viewport_pixel_capture | renderer_output
  assetType: viewport | beauty_render | control_pass
  qualityClaim: viewport_pixels_only | renderer_output_from_current_render_setup
  dragDropMvpCompatible: true | false

source:
  type: viewport | camera
  dcc: 3dsmax | blender
  adapter: 3dsmax | blender
  viewName
  cameraName
  cameraOrViewNotes

selection:
  primaryObjectName
  selectedObjectNames
  objectTypes
  hierarchyOrCollectionHints

materials:
  materialNames
  materialNotes

maskOrRegion:
  intent
  region
  notes

output:
  requestedWidth
  requestedHeight
  imagePath
  imageWidth
  imageHeight
  viewportWidth
  viewportHeight
  aspectRatioSource
  sizePolicy: actual_viewport_pixels | resized_from_viewport_pixels | renderer_requested_size

handoff:
  sessionFolder
  localFiles
  canvasUrl
```

The packet is not a promise that the image is final render quality unless
`captureFamily` is `renderer_output`.

### Blender Parity Requirements

Blender must match the stable 3ds Max evidence packet before implementation
expands beyond planning.

- Viewport or camera source: record `viewport` or `camera`, active camera name
  when available, and enough view/camera notes to reproduce user intent.
- Selected object identity: record primary selected object, all selected objects,
  object types, and collection or hierarchy hints.
- Material notes: record material names and concise AI-useful material summaries,
  not full node graph dumps.
- Mask or region intent: record whether the user intended selected-object mask,
  viewport region, crop, local repaint, object protection, or background change.
- Output size and aspect ratio: record requested size, actual capture size,
  aspect ratio source, and fit strategy for mismatched ratios.
- Handoff URL or local file exchange: local capture session folder is the stable
  exchange mechanism; URL handoff can open Instant Canvas but must point back to
  session metadata and files.

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
