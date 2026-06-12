# Development Plan

This folder is the development control center for Instant Canvas.

Use one feature folder per work pass. The goal is to keep product thinking,
implementation notes, and acceptance checks separated so the project does not
turn into one large mixed context.

## Folder Map

| Folder | Owns |
| --- | --- |
| `01-ui-shell/` | Visual design, layout, bilingual UI, responsive behavior |
| `02-canvas-editor/` | Brush, masks, selection, transform, layer menu |
| `03-realtime-api/` | Local server, OpenAI-compatible API, custom API |
| `04-dcc-adapters/` | 3ds Max now, Blender later, DCC evidence packets |
| `05-ai-backends/` | Provider strategy, local preview, future ComfyUI |
| `06-testing-release/` | Smoke tests, GitHub safety, customer handoff |

## Working Rule

Before coding, choose one primary folder. Read that folder first, then only read
the source files it points to. If a change crosses folders, update both folders.

Keep each folder small:

- `README.md`: goal, current state, next work, key files, acceptance checks
- optional short notes only when needed
- no customer secrets, captures, renders, or large assets


