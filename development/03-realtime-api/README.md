# Realtime API

## Purpose

Owns the local server and provider contract. The browser should never hold API
keys directly. Customers should be able to use OpenAI-compatible or custom image
providers without editing the frontend.

## Current State

- Local server exposes `GET /api/status`, `POST /api/test-provider`, and
  `POST /api/realtime-render`.
- Local server also exposes `GET /api/config` and `POST /api/config` for the API
  Settings panel.
- API Settings can save provider URL, model, and key into local `.env`.
- OpenAI-compatible image edit path exists.
- Custom HTTP JSON adapter exists.
- Static demo can store customer Custom API settings in browser localStorage
  and call that endpoint directly when CORS allows it. This is browser-local
  customer testing, not production secret safety.
- `test-api-contract.mjs` validates custom API request/response shape, missing
  provider config, no-image custom responses, and OpenAI-compatible proxy error
  visibility.

## Next Work

- Add clearer provider presets without storing secrets in the page.
- Add request log preview with secrets redacted.
- Add timeout and cancellation controls for realtime mode.
- Add better error messages for quota, invalid key, bad model, and proxy
  mistakes.
- Keep static direct mode clearly labeled as customer testing, not production
  secret handling.

## Key Files

- `serve-static.mjs`
- `capture-canvas/serve-static.mjs`
- `capture-canvas/app.mjs`
- `capture-canvas/test-api-contract.mjs`
- `docs/API_ADAPTER.md`
- `.env.example`

## Acceptance Checks

- No real key is committed.
- Missing provider config returns an explicit message, not fake success.
- Custom API receives `sourceImageDataUrl`, `maskDataUrl`, `prompt`, `strength`,
  `assets`, `mask`, `output`, and `dcc_capture_bridge.contract`.
- Provider test/config responses do not echo saved secrets.
- OpenAI-compatible proxy failures return visible status/message summaries.
- Static demo without a server stays usable in local preview mode.
- `node capture-canvas/test-api-contract.mjs` passes.
