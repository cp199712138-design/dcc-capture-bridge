# DCC Adapters

DCC adapters isolate software-specific APIs from the product core.

The core should never directly call 3ds Max or Blender APIs. It should call the active adapter.

## Minimum Contract

Every adapter should expose these capabilities:

```text
getDccInfo()
getViewportInfo()
captureViewportAsset(request)
renderBeautyAsset(request)
listCameras()
captureControlPass(request)
```

## 3ds Max Adapter

Expected implementation:

```text
src/adapters/3dsmax/
```

Responsibilities:

- Read active viewport size.
- Capture active viewport image.
- Run current renderer only when requested.
- Restore temporary viewport state after control-pass capture.
- Return structured results, not UI dialogs.

## Blender Adapter

Expected future implementation:

```text
src/adapters/blender/
```

Responsibilities:

- Use `bpy` for viewport and render operations.
- Write assets into the same capture session structure.
- Reuse the same capture-session schema.

## Adapter Rule

If a feature can be expressed as a typed asset, it belongs in the shared contract.

If a feature depends on a specific DCC API, it belongs inside that DCC adapter.
