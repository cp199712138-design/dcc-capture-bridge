# Return Brief

This is the quick brief for the next working session.

## Current Direction

The repository is:

```text
dcc-capture-bridge
```

The product direction is:

```text
3ds Max viewport capture MVP today
AI-readable DCC capture bridge later
```

## Important Correction

The primary value is not replacing 3ds Max rendering.

The primary value is:

```text
fast viewport capture
-> clean reference image
-> future AI input / control asset
```

Production Render is a secondary convenience mode. It uses the current 3ds Max Render Setup and renderer.

## Current MVP File

```text
dist/PerfectHDScreenshotPro_MVP.ms
```

Current behavior:

- Drag into a 3ds Max viewport.
- Detect active viewport size.
- Save a real-pixel viewport snapshot.
- Optional Production Render using current Render Setup.
- Open native Render Setup from the panel.

## New Planning Docs

- `docs/reality-first-principles.md`
- `docs/ai-readable-capture-spec.md`
- `docs/demo-tutorial-plan.md`
- updated `docs/validation-matrix.md`
- updated `docs/development-roadmap.md`

## Next Best Step

Test the MVP in 3ds Max:

1. Download `dist/PerfectHDScreenshotPro_MVP.ms`.
2. Drag it into a 3ds Max viewport.
3. Test Detect Viewport.
4. Test Save Viewport Snapshot as PNG.
5. Confirm output size equals detected viewport size.
6. Test Open Render Setup.
7. Optionally test Production Render.
8. Paste any MAXScript error text back into the thread.

## After Runtime Test

If MVP works:

- Improve UI spacing and labels.
- Add metadata file.
- Add aspect-ratio lock for render mode.
- Add overwrite protection.
- Create first short tutorial.

If MVP fails:

- Fix MAXScript compatibility first.
- Do not add ComfyUI features yet.
