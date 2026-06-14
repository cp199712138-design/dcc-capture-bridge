# Dispatcher Acceptance Checklist

Before a customer-test handoff, the dispatcher must verify:

- `node capture-canvas/check-page.mjs` passes.
- `node capture-canvas/simulate-flow.mjs` passes.
- `node capture-canvas/test-api-contract.mjs` passes.
- `node capture-canvas/browser-smoke.mjs` passes or reports a clear environment blocker.
- `rg 'sk-[A-Za-z0-9]' . -g '!node_modules' -g '!.git' -g '!.env'` finds no real API key.
- UI and Canvas changes do not overlap text or controls at desktop size.
- API errors do not silently fall back to fake success.
- 3ds Max capture output does not claim viewport pixels are true high-resolution render output.
- Blender remains scoped to adapter parity planning until the 3ds Max packet is stable.
- Release notes identify what is real, what is preview, and what requires provider configuration.
