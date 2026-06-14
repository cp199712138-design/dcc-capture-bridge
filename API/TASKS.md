# API Thread Tasks

Owner thread: `Instant Canvas 即时画布 / 03 API`

## Scope

Owns local server routes, provider selection, OpenAI-compatible API, custom HTTP adapter, `.env.example`, API docs, and secret-safe request handling.

Primary files:

- `API/README.md`
- `development/03-realtime-api/README.md`
- `serve-static.mjs`
- `capture-canvas/serve-static.mjs`
- `capture-canvas/test-api-contract.mjs`
- `docs/API_ADAPTER.md`
- `.env.example`

## Do Not Touch

- Canvas transform behavior.
- Visual redesign.
- DCC adapter source files unless changing the shared request contract and documenting it.

## First Assignment

Audit and repair provider behavior:

- missing configuration returns explicit messages
- test-provider does not expose secrets
- custom API request includes the documented evidence fields
- static demo mode is clearly browser-local and does not imply production secret safety
- OpenAI-compatible proxy errors are visible to the user

Make only focused API/server/doc fixes.

## Verification

Run:

```powershell
node capture-canvas/test-api-contract.mjs
node capture-canvas/check-page.mjs
```

## Report Format

```text
STATUS:
FILES CHANGED:
VERIFICATION:
RISKS:
NEXT:
```
