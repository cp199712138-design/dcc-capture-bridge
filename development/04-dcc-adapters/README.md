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
- Keep Blender as a parity plan until the Max packet is stable.
- Decide whether the DCC plugin opens the canvas, sends data to the canvas, or
  both.

## Blender Parity Requirements

The Blender adapter must match the 3ds Max evidence packet before it gets its
own add-on implementation.

- Source: record whether the capture came from a viewport or a camera, including
  enough camera/view data to explain the image.
- Selected object identity: record primary selection, full selection list, object
  names, object types, and collection/path hints.
- Material notes: record material names and AI-useful material summaries without
  copying entire Blender node trees.
- Mask or region intent: record whether the user intended selected-object mask,
  viewport region, crop, local repaint, object protection, or background change.
- Output size and aspect ratio: record requested size, actual capture size,
  aspect ratio source, and fit strategy when ratios differ.
- Handoff strategy: prefer a local capture session folder with assets and
  metadata; URL handoff may open Instant Canvas but must not replace local
  evidence.

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

## 3ds Max Adapter Boundary

The adapter has two truthful output families:

- `viewport_pixel_capture`: reads pixels from the active 3ds Max viewport with
  `viewport.getViewportDib` or `gw.getViewportDib`. This is evidence of the
  current view. It is not a high-resolution render. Requested output size must
  not be presented as render quality; if a bitmap is resized, metadata must say
  it was resized from viewport pixels.
- `renderer_output`: calls the current 3ds Max renderer with explicit output
  width and height. This can be true high-resolution output, but only according
  to the scene's active Render Setup.

Instant Canvas should treat viewport packets as source evidence for visual
understanding, not as final render proof.

## Evidence Packet v1

Minimum fields for `instant_canvas.dcc_evidence.v1`:

- `packet_version`
- `dcc`
- `adapter`
- `capture_family`
- `asset_type`
- `image_path`
- `image_width`
- `image_height`
- `viewport_width`
- `viewport_height`
- `requested_width`
- `requested_height`
- `size_policy`
- `camera_or_viewport`
- `selected_object_intent`
- `material_notes`
- `quality_claim`
- `drag_drop_mvp_compatible`

For drag/drop MVP testing, `dist/PerfectHDScreenshotPro_MVP.ms` may continue to
write a simple `metadata.txt`, but the keys above are the contract that the
source adapter and future API handoff should preserve.
- Blender planning remains contract-only until the 3ds Max evidence packet is
  stable and the dispatch thread authorizes add-on work.

