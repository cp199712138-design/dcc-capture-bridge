# Next Session Handoff

## Status

- Branch: `codex/instant-canvas-scaffold`
- Scope remains browser Instant Canvas only: `UI`, `Canvas`, `API`, `测试发布`.
- Frozen this round: `3ds Max`, `Blender`, `ComfyUI`.

## Completed In This Pass

- FLUX.2 provider now has longer polling, explicit BFL terminal statuses, server-side sample download, and redacted upstream error summaries.
- Remote providers are manual-only in the UI: local edits do not call cloud APIs; users click Generate once.
- Canvas ignores non-left-button pointerdown so right-click menus do not paint accidental marks.
- Model import failure keeps the previous asset and the file input resets for retry.
- Release docs now include `test-model-import.mjs`, FLUX.2 manual-generation notes, and browser-smoke skip handling.

## Verification

- `node --check .\serve-static.mjs`
- `node --check .\capture-canvas\serve-static.mjs`
- `node --check .\capture-canvas\app.mjs`
- `node --check .\capture-canvas\api-client.mjs`
- `node .\capture-canvas\check-page.mjs`
- `node .\capture-canvas\test-api-contract.mjs`
- `node .\capture-canvas\test-model-import.mjs`
- `node .\capture-canvas\simulate-flow.mjs`
- `node .\capture-canvas\check-page.mjs --all`
- Secret scan found no real `sk-...` keys in tracked project files.

`browser-smoke.mjs` was skipped by the script because the local Chrome/CDP environment timed out. Treat the next release pass as needing manual browser validation.

## Next

1. Start the local server and manually verify Chrome: example image, brush, rectangle, circle, select move/resize, real right-click menu, undo/redo, bad model retry, FLUX.2 missing-key state.
2. If a real `BFL_API_KEY` is available, test only one `fast_preview` render first. Do not test final/flex until fast preview succeeds.
3. Keep `Auto` and `Mock` as no-cost defaults.
