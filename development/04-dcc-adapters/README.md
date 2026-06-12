# DCC Adapters

## Purpose

Owns 3ds Max now and Blender later. DCC adapters should capture trustworthy
evidence: viewport, camera, selected object, material references, masks, and
metadata for AI generation.

## Current State

- Older 3ds Max MVP still exists for capture testing.
- New 3ds Max source structure exists under `src/core`, `src/ui`, and
  `src/adapters`.
- The web canvas is currently the main product direction.

## Next Work

- Keep 3ds Max capture as a small adapter, not the whole product.
- Define the exact evidence packet sent from Max to the canvas/API.
- Add Blender adapter plan after Max packet is stable.
- Decide whether the DCC plugin opens the canvas, sends data to the canvas, or
  both.

## Key Files

- `src/PHDS_Loader.ms`
- `src/core/*.ms`
- `src/ui/PHDS_MainRollout.ms`
- `src/adapters/3dsmax/DCC_3dsMaxAdapter.ms`
- `dist/PerfectHDScreenshotPro_MVP.ms`
- `docs/dcc-adapter-architecture.md`

## Acceptance Checks

- Drag/drop 3ds Max startup path still works for MVP testing.
- DCC capture does not fake render output.
- Capture metadata is explicit enough for AI: source, camera/viewport, size,
  selected object intent, and material notes.

