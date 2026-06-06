# Demo Tutorial Plan

## Goal

Every major feature should have a short, repeatable demo. The demo should prove the feature works in real software.

## Demo 1: 3ds Max Viewport Snapshot MVP

Length: 2 minutes.

Steps:

1. Open a simple 3ds Max scene.
2. Drag `dist/PerfectHDScreenshotPro_MVP.ms` into the viewport.
3. Confirm the panel opens.
4. Click `Detect Viewport`.
5. Choose output folder.
6. Click `Save Viewport Snapshot`.
7. Open the saved file.
8. Show that the output size matches the detected viewport size.

Proof:

- Saved image file.
- Screenshot of the plugin panel.
- Note of 3ds Max version.

## Demo 2: Production Render Mode

Length: 2 minutes.

Steps:

1. Open Render Setup from the plugin.
2. Set renderer and render size in native 3ds Max Render Setup.
3. Return to plugin.
4. Switch to Production Render.
5. Click `Run Production Render`.
6. Open output file.

Important explanation:

- This mode does not configure the renderer for the user.
- It uses the current 3ds Max render settings.
- The core value remains capture workflow, not replacing rendering.

## Demo 3: AI-ready Capture Concept

Length: 3 minutes.

Steps:

1. Capture a clean viewport image.
2. Manually load it into ComfyUI img2img.
3. Generate one output.
4. Compare source and result.
5. Record what worked and what failed.

Proof:

- Source capture.
- ComfyUI workflow screenshot or prompt id.
- Generated result.
- Notes on whether subject structure was preserved.

## Demo 4: Future ComfyUI Health Check

Length: 1 minute.

Steps:

1. Start ComfyUI.
2. Click `Check ComfyUI` in future UI.
3. Show system stats and node availability.

Proof:

- Status: online.
- Returned API data.
- Required nodes found or missing.

## Tutorial Format

Each tutorial should include:

- Goal.
- Required software version.
- Input scene.
- Steps.
- Expected output.
- Troubleshooting.
- Known limitations.

## Rule

If we cannot demo a feature clearly, it is not ready to market.
