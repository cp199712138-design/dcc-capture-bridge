# Architecture Decisions

## ADR-001: English-first Core

Decision: code, API names, GitHub docs, and release notes are English-first.

Reason:

- 3ds Max / Blender developer ecosystems are English-heavy.
- International customers need English by default.
- MAXScript string encoding can be fragile for direct Chinese UI strings.

Consequence:

- Chinese UI will use a tested localization path later.

## ADR-002: Single-file MVP, Modular Source Later

Decision: ship MVP as one `.ms` file under `dist/`.

Reason:

- Drag-and-drop usage should be simple.
- First users should not manage folders or installers.
- The MVP is small enough for one file.

Consequence:

- Source can be split later once behavior is proven.
- A build step will later generate the single release file from modular source.

## ADR-003: UI Must Stay Thin

Decision: UI reads inputs, displays status, and calls the core API. It should not directly build paths, save bitmaps, or call render internals.

Reason:

- Future UI may be MAXScript rollout, Blender panel, or a canvas workspace.
- Core behavior must be portable.

## ADR-004: ComfyUI Is a Backend, Not a UI Clone

Decision: future ComfyUI integration should call workflow APIs and expose curated workflow parameters. It should not recreate ComfyUI's node editor inside DCC tools.

Reason:

- Rebuilding node editing inside 3ds Max/Blender is heavy and fragile.
- Artists need a focused bridge, not another node graph.

## ADR-005: Workflow Templates Must Be Versioned

Decision: ComfyUI workflows will be stored as versioned templates with mapping files.

Example:

```text
workflows/img2img-basic/workflow_api.json
workflows/img2img-basic/mapping.json
workflows/img2img-basic/README.md
```

Reason:

- ComfyUI node IDs and inputs can change.
- Hard-coded node paths will rot.

## ADR-006: Capture Assets Are First-class Outputs

Decision: future outputs should not be just screenshots. They should be typed assets.

Examples:

```text
beauty
viewport
clay
depth
normal
mask
camera_metadata
```

Reason:

- AI workflows need structured control inputs.
- Review and rerun workflows need metadata.

## ADR-007: Capture-first, Render-second

Decision: the default MVP mode is Viewport Snapshot. Production Render is an optional secondary mode.

Reason:

- The product's real value is fast capture for reference and AI input.
- If the tool only wraps normal rendering, customers can just render directly.
- 3ds Max viewport capture APIs return the active viewport's real pixels; they do not provide arbitrary 8K viewport output.

Consequence:

- UI must not present 8K as a fake viewport screenshot feature.
- Render mode must clearly state it uses current 3ds Max Render Setup.
- Future AI features should build from capture assets first, not render automation first.
