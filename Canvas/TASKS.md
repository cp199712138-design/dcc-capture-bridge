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

## Verification

Run:

```powershell
node capture-canvas/simulate-flow.mjs
node capture-canvas/browser-smoke.mjs
```

## Report Format

```text
STATUS:
FILES CHANGED:
VERIFICATION:
RISKS:
NEXT:
```
