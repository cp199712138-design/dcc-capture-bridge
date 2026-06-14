# Testing And Release Thread Tasks

Owner thread: `Instant Canvas 即时画布 / 06 测试发布`

## Scope

Owns smoke tests, release checklist, packaging readiness, GitHub readiness, and customer-test handoff notes.

Primary files:

- `测试发布/README.md`
- `development/06-testing-release/README.md`
- `capture-canvas/check-page.mjs`
- `capture-canvas/simulate-flow.mjs`
- `capture-canvas/test-api-contract.mjs`
- `capture-canvas/browser-smoke.mjs`
- `GITHUB_UPLOAD_CHECKLIST.md`
- `GITHUB_RELEASE_STRATEGY.md`

## Do Not Touch

- Product logic except when fixing a test harness bug.
- API/server behavior except when adding test-only local mock support with API thread coordination.
- DCC adapter implementation files.

## First Assignment

Create a reliable test-and-release pass:

- confirm the documented smoke commands match the actual files
- identify whether one command can run all checks
- ensure secret scan guidance does not flag placeholders as real keys
- prepare release notes structure for a customer-test build

## Verification

Run:

```powershell
node capture-canvas/check-page.mjs
node capture-canvas/simulate-flow.mjs
node capture-canvas/test-api-contract.mjs
node capture-canvas/browser-smoke.mjs
```

If a browser smoke failure is environmental, capture the exact error and classify it.

## Report Format

```text
STATUS:
FILES CHANGED:
VERIFICATION:
RISKS:
NEXT:
```
