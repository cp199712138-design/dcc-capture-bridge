# UI Shell

## Purpose

Owns the product surface: dark low-saturation visual style, bilingual UI,
left/right realtime layout, bottom toolbar, prompt card, API settings modal,
and responsive behavior.

## Current State

- Dark workspace with left input canvas and right realtime output canvas.
- Chinese/English switch exists and avoids mixed default labels.
- Bottom floating toolbar and prompt panel exist.
- API Settings modal exists.
- Current style is closer to Krea realtime edit, but still needs stronger
  polish around density, icon clarity, and spacing.

## Next Work

- Replace letter buttons with a consistent icon system.
- Make toolbar states clearer: active tool, disabled tool, loading state.
- Improve API Settings modal to feel like a serious customer settings page.
- Add a compact mobile/tablet layout only after desktop is stable.

## Key Files

- `capture-canvas/index.html`
- `capture-canvas/app.mjs`
- `PRODUCT_UI_SYSTEM.md`
- `UI_DIRECTION.md`
- `docs/ui-redesign-direction.md`

## Acceptance Checks

- No mixed Chinese/English labels in either language mode.
- No toolbar/prompt overlap at 1600x900 and 1366x768.
- Main actions remain visible without scrolling on desktop.
- `node capture-canvas/check-page.mjs` passes.
- A fresh Chrome screenshot shows both canvases and the prompt panel clearly.

