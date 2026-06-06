# Development Roadmap

## Milestone 0: Repository Foundation

Status: in progress.

Deliverables:

- README
- MVP script
- roadmap docs
- UI direction
- AI pipeline plan

## Milestone 1: 3ds Max MVP Runtime Validation

Goal: prove the current drag-drop script works in real 3ds Max.

Tasks:

- Drag script into 3ds Max viewport.
- Confirm rollout opens.
- Confirm viewport detection.
- Confirm PNG viewport capture.
- Confirm high-res render at 1920x1080 and 3840x2160.
- Confirm output path creation.
- Record any MAXScript errors.

Exit criteria:

- One confirmed successful viewport capture.
- One confirmed successful high-res render.
- Known failures documented.

## Milestone 2: Stabilize MVP API

Tasks:

- Add safer folder detection.
- Add overwrite protection.
- Add aspect-ratio lock.
- Add clearer error messages.
- Add version label in UI.
- Add optional log file.

Exit criteria:

- Script can be reused repeatedly without stale UI issues.
- User-facing errors are understandable.

## Milestone 3: Localization Strategy

Tasks:

- Test Chinese strings in target 3ds Max versions.
- Decide whether localization lives in `.ini`, `.json`, or separate `.ms` string table.
- Add English/Chinese language switch only after encoding is proven.

Exit criteria:

- No garbled Chinese in 3ds Max UI.
- English remains default.

## Milestone 4: ComfyUI Health Check

Tasks:

- Detect local ComfyUI server.
- Query `/system_stats`.
- Query `/object_info`.
- Show status in UI.
- Do not run generation yet.

Exit criteria:

- UI can reliably tell whether ComfyUI is reachable.

## Milestone 5: First AI Workflow

Tasks:

- Export viewport image.
- Upload image to ComfyUI.
- Fill img2img workflow template.
- Submit `/prompt`.
- Poll `/history` or listen via WebSocket.
- Save generated output path.

Exit criteria:

- One screenshot can produce one AI output through a known workflow.

## Milestone 6: Control Passes

Tasks:

- Add depth pass strategy.
- Add normal/clay/mask pass strategy.
- Store metadata.
- Add workflow mapping for ControlNet.

Exit criteria:

- At least one workflow uses a DCC-generated control pass.

## Milestone 7: Blender Adapter

Tasks:

- Create minimal Blender add-on skeleton.
- Add viewport/camera capture operator.
- Mirror Capture API concepts in Python.

Exit criteria:

- Blender can produce equivalent capture assets.
