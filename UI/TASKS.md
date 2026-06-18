# UI Thread Tasks

Owner thread: `Instant Canvas 即时画布 / 01 UI`

## Scope

Owns visual shell, bilingual labels, layout density, toolbar clarity, prompt panel, API settings modal, and responsive behavior.

Primary files:

- `UI/README.md`
- `development/01-ui-shell/README.md`
- `capture-canvas/index.html`
- UI-only sections of `capture-canvas/app.mjs`
- `PRODUCT_UI_SYSTEM.md`
- `UI_DIRECTION.md`
- `docs/ui-redesign-direction.md`

## Do Not Touch

- Server/provider logic in `serve-static.mjs` or `capture-canvas/serve-static.mjs`.
- Canvas geometry, brush math, transform math, or layer operation internals unless the dispatcher grants scope.
- 3ds Max or Blender adapter files.

## First Assignment

Repair the browser product surface before adding features:

- dark, dense, Krea-style, production-tool feel
- no mixed Chinese/English labels in either mode
- toolbar and prompt panel do not overlap at desktop sizes
- API Settings reads as a serious customer settings surface
- first viewport clearly communicates an editable realtime canvas, not a generic screenshot plugin

Make only small UI repairs that are clearly inside this scope.

## 2026-06-18 UI Surface Repair

- Switched the HTML default first paint to Chinese-first labels, status text, prompt text, and tooltips so the default CN state does not flash obvious English UI copy before app hydration.
- Clarified the destructive toolbar action as mask-only with `清空遮罩` / `清遮`.
- Gave the sidebar, floating toolbar, prompt composer, and top status area a little more room so Generate, Live, provider/API status, and prompt chips wrap instead of crowding the canvas.
- Kept existing control ids and app selectors unchanged; no API, Canvas, Blender, 3ds Max, or server files were edited.

## Verification

Run:

```powershell
node capture-canvas/check-page.mjs
```

If using Chrome visual verification, capture evidence at:

```text
http://127.0.0.1:8765/capture-canvas/index.html
```

## Report Format

```text
STATUS:
FILES CHANGED:
VERIFICATION:
RISKS:
NEXT:
```
