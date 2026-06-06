# UI Redesign Direction

The product should move toward a clean capture studio, not a dense settings dialog.

## References

- Vectary Canvas: canvas-first 3D/AI ideation direction.
- Krea Realtime: split workspace with input canvas and live AI output.

## What To Borrow

- A large visual work area.
- Clear input/output relationship.
- Few controls visible by default.
- Fast iteration over perfect one-shot setup.
- Reference images, prompts, and generated outputs in one workspace.

## What Not To Copy Yet

- A full node editor.
- A full ComfyUI clone inside 3ds Max.
- Heavy UI before the capture protocol is stable.

## MVP UI Rule

The 3ds Max drag-and-drop file should stay small and practical:

```text
Input
Output
Primary action
Last result
```

Advanced capture types should be added only after they map to the shared capture-session schema.

## Future UI Direction

```text
left: DCC capture sources
center: preview / canvas / reference board
right: AI output and controls
bottom: capture timeline / multi-angle frames
```

This future UI should be independent from 3ds Max:

```text
Modern UI
  -> shared capture core
  -> 3ds Max adapter
  -> Blender adapter
  -> ComfyUI adapter
```

3ds Max and Blender should not own the final product UI. They should provide scene data and capture assets.
