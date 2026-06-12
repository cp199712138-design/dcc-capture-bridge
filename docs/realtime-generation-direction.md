# Realtime Generation Direction

## Current Decision

Do not bind the product to one AI backend yet.

The canvas should produce one neutral generation request:

```text
DCC evidence assets
+ prompt
+ vector mask strokes
+ generation strength
+ output target
-> provider adapter
```

Then the provider adapter can route the request to:

- `mock-local`: local interaction preview with no AI backend.
- `comfyui-local`: user's own ComfyUI server, likely `http://127.0.0.1:8188`.
- `cloud-api`: hosted image model API for customer-facing builds.

## Why

The product goal is not ordinary screenshots. The goal is AI-readable product certainty:

- exact product angle
- exact product shape
- mask / region intent
- material and texture references
- reusable evidence session

Keeping a provider-neutral request prevents the UI from becoming tied to one model, one DCC app, or one workflow engine.

## Recommended Path

### Personal / Power User Mode

Use local ComfyUI later.

Best fit:

- user already has GPU
- needs custom workflows
- wants node-based control
- accepts setup complexity
- wants lower marginal cost after setup

Likely integration:

```text
Canvas request
-> ComfyUI workflow template
-> POST /prompt
-> WebSocket progress
-> preview image update
```

### Customer / Product Mode

Use cloud API later.

Best fit:

- customers should not install models
- predictable onboarding
- easier support
- stable quality
- billing can be wrapped into product pricing

Likely integration:

```text
Canvas request
-> API adapter
-> image edit / generation endpoint
-> returned preview
```

## Realtime UX Rule

Realtime does not need full-quality rendering on every brush movement.

Use two levels:

1. Draft preview: fast, lower resolution, updates often.
2. Commit render: higher quality, runs when user presses generate/export.

This protects cost, latency, and local GPU memory.

## Next Engineering Step

Keep `capture-core.mjs` small and stable. Add provider adapters beside it only when needed:

```text
capture-core.mjs
providers/
  mock-provider.mjs
  comfyui-provider.mjs
  api-provider.mjs
```

The UI should only know about:

- current provider
- request status
- preview image
- error message

It should not know ComfyUI workflow JSON internals or vendor API details.
