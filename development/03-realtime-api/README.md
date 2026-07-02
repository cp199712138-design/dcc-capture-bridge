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
- BFL FLUX.2 server-side provider exists as `bfl-flux2`; it uses
  `BFL_API_KEY`, `BFL_BASE_URL`, `BFL_FAST_MODEL`, `BFL_FINAL_MODEL`, and
  `BFL_FLEX_MODEL`. `/api/config` only reports `bfl.key_saved`, never the key.
  The server submits to `/v1/{model}`, follows BFL `polling_url`, handles
  `Pending`, `Ready`, `Error`, `Request Moderated`, `Content Moderated`, and
  `Task not found`, then downloads `result.sample` server-side before returning
  a data URL to the browser.
- BFL FLUX.2 is treated as reference-image editing: the payload contains
  `prompt`, `input_image`, `seed`, `output_format`, and safe `aspect_ratio`
  only. It does not claim precise mask inpainting; `maskDataUrl` and `strength`
  remain local-preview or other-provider inputs.
- Custom HTTP JSON adapter exists.
- Static demo can store non-sensitive provider settings in browser localStorage.
  Real OpenAI, BFL, or Custom API keys are not persisted in the static page.
- `test-api-contract.mjs` validates custom API request/response shape, missing
  provider config, no-image custom responses, and OpenAI-compatible proxy error
  visibility.

## Next Work

- Add clearer provider presets without storing secrets in the page.
- Add request log preview with secrets redacted.
- Add better error messages for quota, invalid key, bad model, and proxy
  mistakes.
- Keep static direct mode clearly labeled as customer testing, with keys entered
  per request only.

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
- BFL configuration checks do not call generation endpoints and do not validate
  credits or model access.
- Static demo without a server stays usable in local preview mode.
- `node capture-canvas/test-api-contract.mjs` passes.
