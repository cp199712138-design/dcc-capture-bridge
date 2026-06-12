# Canvas Editor

## Purpose

Owns the Krea-style editing interaction: drawing, masking, selecting, moving,
resizing, layer actions, and future object/layer editing.

## Current State

- Brush, eraser, rectangle, circle, undo, redo, and clear exist.
- Select mode can pick mask regions.
- Selected regions can move and resize with corner handles.
- Right-click layer menu supports lock, order, duplicate, delete, flip, fit,
  and fill.
- Browser smoke test verifies example loading, drawing, context menu, and
  duplicate action.

## Next Work

- Split masks, image references, and generated images into explicit editable
  object layers.
- Add visible layer list or lightweight object inspector only if the canvas
  interaction needs it.
- Add transform handles for imported image/reference objects, not only masks.
- Add better brush smoothing and cursor accuracy tests.

## Key Files

- `capture-canvas/app.mjs`
- `capture-canvas/index.html`
- `capture-canvas/browser-smoke.mjs`
- `capture-canvas/simulate-flow.mjs`

## Acceptance Checks

- Brush cursor matches pointer position.
- Select mode uses normal pointer/resize cursors.
- Right-click menu opens on a selected region.
- Duplicate/delete/order/flip actions visibly update the selected region.
- `node capture-canvas/browser-smoke.mjs` passes.

