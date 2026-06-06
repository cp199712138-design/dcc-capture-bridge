# Development Roadmap

## Milestone 0: Repository Foundation

Status: in progress.

Deliverables:

- README
- MVP script
- roadmap docs
- UI direction
- AI pipeline plan
- reality-first principles
- demo tutorial plan

## Milestone 1: 3ds Max Viewport Capture Runtime Validation

Goal: prove the drag-drop script works in real 3ds Max and produces useful capture assets.

Tasks:

- Drag script into 3ds Max viewport.
- Confirm rollout opens.
- Confirm viewport detection.
- Confirm PNG viewport snapshot.
- Confirm output path creation.
- Confirm the saved image matches detected viewport size.
- Record any MAXScript errors.

Exit criteria:

- One confirmed successful viewport snapshot.
- Saved image is useful as a human reference.
- Saved image is clean enough for a manual AI img2img smoke test.
- Known failures documented.

## Milestone 2: Optional Production Render Validation

Goal: prove render mode is clearly secondary and uses current Render Setup.

Tasks:

- Open native Render Setup from the plugin.
- Set renderer and render size in 3ds Max.
- Run Production Render from the plugin.
- Confirm output file.
- Confirm UI clearly explains that render settings are not managed by the plugin.

Exit criteria:

- One successful production render.
- No false claim that the plugin replaces renderer setup.

## Milestone 3: Stabilize MVP API

Tasks:

- Add safer folder detection.
- Add overwrite protection.
- Add aspect-ratio lock for render mode.
- Add clearer error messages.
- Add version label in UI.
- Add optional log file.
- Add metadata file for capture outputs.

Exit criteria:

- Script can be reused repeatedly without stale UI issues.
- User-facing errors are understandable.
- Capture outputs include basic metadata.

## Milestone 4: AI-readable Capture Smoke Test

Goal: prove the captured viewport image can actually be used by an AI workflow.

Tasks:

- Capture a clear viewport image.
- Manually load it into ComfyUI img2img.
- Generate one output.
- Compare source and result.
- Document whether subject structure was preserved.

Exit criteria:

- Source capture and generated output are saved.
- Notes explain what worked and what failed.

## Milestone 5: Localization Strategy

Tasks:

- Test Chinese strings in target 3ds Max versions.
- Test Chinese output paths.
- Decide whether localization lives in `.ini`, `.json`, or separate `.ms` string table.
- Add English/Chinese language switch only after encoding is proven.

Exit criteria:

- No garbled Chinese in 3ds Max UI.
- English remains default.

## Milestone 6: ComfyUI Health Check

Tasks:

- Detect local ComfyUI server.
- Query `/system_stats`.
- Query `/object_info`.
- Show status in UI.
- Do not run generation yet.

Exit criteria:

- UI can reliably tell whether ComfyUI is reachable.
- Missing nodes are reported clearly.

## Milestone 7: First Integrated AI Workflow

Tasks:

- Export viewport image.
- Upload image to ComfyUI.
- Fill img2img workflow template.
- Submit `/prompt`.
- Poll `/history` or listen via WebSocket.
- Save generated output path.

Exit criteria:

- One screenshot can produce one AI output through a known workflow.

## Milestone 8: Control Passes

Tasks:

- Add depth pass strategy.
- Add normal/clay/mask pass strategy.
- Store metadata.
- Add workflow mapping for ControlNet.

Exit criteria:

- At least one workflow uses a DCC-generated control pass.

## Milestone 9: Blender Adapter

Tasks:

- Create minimal Blender add-on skeleton.
- Add viewport/camera capture operator.
- Mirror Capture API concepts in Python.

Exit criteria:

- Blender can produce equivalent capture assets.
