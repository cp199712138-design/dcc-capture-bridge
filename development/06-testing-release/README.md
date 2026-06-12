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

## Next Work

- Add a single `npm` or PowerShell command that runs all tests.
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
- `rg 'sk-' .` finds no real API keys.

