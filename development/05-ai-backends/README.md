# AI Backends

## Purpose

Owns model/provider strategy. This includes API-first customer use, local
preview, and future ComfyUI/local node support.

## Current State

- Local preview exists for testing without a paid provider.
- OpenAI-compatible path exists through the local server.
- Custom HTTP provider path exists.
- ComfyUI is intentionally not wired yet.

## Next Work

- Keep customer-facing mode API-first.
- Keep local/ComfyUI as an adapter behind the same server contract.
- Define when realtime should debounce, cancel, or manually generate.
- Add provider comparison notes only when backed by actual testing.

## Key Files

- `docs/realtime-generation-direction.md`
- `docs/ai-capture-purpose.md`
- `docs/API_ADAPTER.md`
- `serve-static.mjs`

## Acceptance Checks

- Provider selection does not expose secrets in the browser.
- Local preview is labeled as local preview.
- Remote provider failure is visible to the user.
- No fake AI result is presented as real API output.

