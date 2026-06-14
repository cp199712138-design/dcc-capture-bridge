# Testing And Release

## Purpose

Owns confidence before customer testing: smoke tests, browser checks, GitHub
sync, privacy checks, and release notes.

## Current State

- Static page checks exist.
- API contract test exists.
- Simulated generation flow exists.
- Headless Chrome browser smoke test exists.
- GitHub push has been validated once.
- `node capture-canvas/check-page.mjs --all` can run the full pass in order.

## Smoke Commands

Run individual checks when isolating failures:

```powershell
node capture-canvas/check-page.mjs
node capture-canvas/simulate-flow.mjs
node capture-canvas/test-api-contract.mjs
node capture-canvas/browser-smoke.mjs
```

Run the full release pass:

```powershell
node capture-canvas/check-page.mjs --all
```

`browser-smoke.mjs` requires local Chrome or Edge. If it fails with a CDP,
Chrome target, or websocket error while the other checks pass, record the exact
error and classify it as environment-sensitive until reproduced in another
browser profile or machine.

## Secret Scan

Use a real-key pattern, not a plain `sk-` search:

```powershell
rg 'sk-(?!\.\.\.)(?!test\b)(?:proj-)?[A-Za-z0-9_-]{20,}' . -g '!node_modules' -g '!.git' -g '!.env' -g '!.env.*'
```

Allowed placeholders include `sk-...`, `test-key`, empty `.env.example` values,
and documentation that explains key setup. Real customer or developer secrets
must never be committed.

## Customer-Test Release Notes

Use this structure for each customer-test handoff:

```text
Build:
Commit:
URL:
What is ready:
What is preview-only:
Provider/API setup required:
Known limits:
Verification run:
Customer test steps:
Rollback / previous build:
```

## Next Work

- Save release notes per customer-test build.
- Add a small pre-push checklist for secrets and large assets.
- Keep temporary clone/test output outside committed source.

## Key Files

- `capture-canvas/check-page.mjs`
- `capture-canvas/simulate-flow.mjs`
- `capture-canvas/test-api-contract.mjs`
- `capture-canvas/browser-smoke.mjs`
- `GITHUB_UPLOAD_CHECKLIST.md`
- `GITHUB_RELEASE_STRATEGY.md`

## Acceptance Checks

- `node capture-canvas/check-page.mjs` passes.
- `node capture-canvas/simulate-flow.mjs` passes.
- `node capture-canvas/test-api-contract.mjs` passes.
- `node capture-canvas/browser-smoke.mjs` passes.
- `node capture-canvas/check-page.mjs --all` passes before customer handoff.
- Real-key scan finds no committed API keys while allowing placeholders.

