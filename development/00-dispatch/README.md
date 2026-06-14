# Dispatch Control

This folder is the central coordination point for the split Instant Canvas threads.

## Thread Map

| Thread | Owns | Primary folders |
| --- | --- | --- |
| `00 项目总览` | Scheduling, conflict control, final verification | `development/00-dispatch`, `docs/superpowers/plans` |
| `01 UI` | Product surface, bilingual labels, responsive layout | `UI`, `development/01-ui-shell`, `capture-canvas/index.html`, UI sections of `capture-canvas/app.mjs` |
| `02 Canvas` | Drawing, masks, selection, transform, layer actions | `Canvas`, `development/02-canvas-editor`, canvas sections of `capture-canvas/app.mjs` |
| `03 API` | Local server, provider contract, secret safety | `API`, `development/03-realtime-api`, `serve-static.mjs`, `capture-canvas/serve-static.mjs`, `docs/API_ADAPTER.md` |
| `04 3ds Max` | 3ds Max capture adapter and package | `3ds Max`, `development/04-dcc-adapters`, `src`, `dist` |
| `05 Blender` | Blender adapter plan and future evidence packet parity | `Blender`, `development/04-dcc-adapters` |
| `06 测试发布` | Smoke tests, release checklist, GitHub readiness | `测试发布`, `development/06-testing-release`, smoke test scripts |

## Coordination Rules

- Each thread edits only its owned files unless the dispatcher explicitly expands scope.
- Cross-cutting changes must be reported in the thread result before another thread changes the same file.
- `capture-canvas/app.mjs` is shared by UI and Canvas; each thread must state the function or section it changed.
- Server files are owned by API; test files are owned by 测试发布 unless a task says otherwise.
- The dispatcher runs final verification and resolves conflicts.

## Report Format

Each child thread reports:

```text
STATUS: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
FILES CHANGED:
VERIFICATION:
RISKS:
NEXT:
```
