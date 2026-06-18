# Canvas Thread Tasks

Owner thread: `Instant Canvas 即时画布 / 02 Canvas`

## Scope

Owns drawing, erasing, masks, selection, transform handles, right-click layer menu, duplicate/delete/order/flip/fill actions, and canvas interaction evidence.

Primary files:

- `Canvas/README.md`
- `development/02-canvas-editor/README.md`
- Canvas interaction sections of `capture-canvas/app.mjs`
- `capture-canvas/browser-smoke.mjs`
- `capture-canvas/simulate-flow.mjs`

## Do Not Touch

- Provider/server code.
- API key handling.
- 3ds Max or Blender files.
- Broad visual redesign outside canvas interaction affordances.

## First Assignment

Audit and repair the canvas interaction path:

- brush cursor matches pointer position
- Select mode uses correct pointer and resize cursor behavior
- selected regions can move and resize predictably
- right-click menu acts on the intended selected region
- duplicate/delete/order/flip actions visibly update the selected region

Make the smallest repair that improves a verified issue.
Do not add new 3ds Max or Blender capture behavior in this round.

## Verification

Run:

```powershell
node capture-canvas/simulate-flow.mjs
node capture-canvas/browser-smoke.mjs
```

## 2026-06-18 Canvas+Browser-3D pass

- Added undo/redo history snapshots for draw, move, resize, and layer-menu edits so transformed mask regions undo back to their prior geometry instead of deleting the last stroke.
- Limited OBJ/STL preview wheel zoom to the same Select-mode gate used by model orbit, keeping brush/mask editing from changing the model camera.
- Extended `browser-smoke` coverage for moved-region undo/redo, OBJ import, Select-mode model zoom, brush-mode wheel ignore, preview request state, and broken OBJ feedback.

## Report Format

```text
STATUS:
FILES CHANGED:
VERIFICATION:
RISKS:
NEXT:
```
