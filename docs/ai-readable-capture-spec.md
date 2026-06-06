# AI-readable Capture Spec

## Goal

Capture assets should be useful to both humans and AI workflows.

A pretty screenshot is not enough. The output should preserve enough structure for image generation, editing, material exploration, and future control workflows.

## Capture Asset Types

### 1. Viewport Snapshot

Purpose:

- Fast reference image.
- Client preview.
- AI img2img input.

Requirements:

- No UI overlays if possible.
- Clear object silhouette.
- Reasonable framing.
- Stable filename and metadata.

### 2. Clay / Studio Capture

Purpose:

- AI can read shape without material noise.
- Good for concept restyling.

Requirements:

- Neutral material.
- High contrast silhouette.
- Simple background.
- Camera metadata saved.

### 3. Depth Pass

Purpose:

- ControlNet / depth-guided generation.
- Spatial structure preservation.

Requirements:

- Normalized depth range.
- No UI elements.
- Matches beauty capture framing.

### 4. Normal Pass

Purpose:

- Surface direction and form guidance.
- Useful for materials and stylized rendering.

Requirements:

- Same resolution and camera as beauty pass.
- Consistent color encoding.

### 5. Mask / Object ID

Purpose:

- Selective edits.
- Material region control.
- Background removal.

Requirements:

- Clean binary or indexed regions.
- Matching resolution.
- Object/selection metadata.

## Output Folder Shape

```text
outputs/
  scene-name/
    2026-06-06_153000/
      capture/
        viewport.png
        clay.png
      control/
        depth.png
        normal.png
        mask.png
      ai/
        generated_001.png
      metadata.json
```

## Metadata

Minimum metadata:

```json
{
  "dcc": "3ds Max",
  "tool_version": "0.2.0",
  "capture_type": "viewport",
  "width": 1920,
  "height": 1080,
  "camera": "active viewport or camera name",
  "timestamp": "2026-06-06T15:30:00",
  "source_scene": "optional scene name"
}
```

## AI Acceptance Test

A capture is AI-readable if:

- The main subject is visible.
- The silhouette is clear.
- The image has enough resolution for the intended workflow.
- There are no distracting UI elements.
- A basic img2img workflow can preserve the subject structure.

Future tests should include side-by-side examples:

```text
DCC capture -> ComfyUI output -> review notes
```
