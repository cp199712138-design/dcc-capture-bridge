# Return Brief

This is the quick brief for the next working session.

## What Changed

The repository has been renamed to:

```text
dcc-capture-bridge
```

The project direction is now clearer:

```text
3ds Max screenshot MVP today
DCC-to-AI capture bridge later
```

## Files Added / Updated

- `README.md`
- `dist/PerfectHDScreenshotPro_MVP.ms`
- `docs/start-plan.md`
- `docs/ui-system.md`
- `docs/ai-pipeline-plan.md`
- `docs/competitor-scan.md`
- `docs/product-vision.md`
- `docs/architecture-decisions.md`
- `docs/development-roadmap.md`
- `docs/validation-matrix.md`
- `.gitignore`

## Current MVP File

```text
dist/PerfectHDScreenshotPro_MVP.ms
```

Current behavior:

- Drag into a 3ds Max viewport.
- Detect active viewport size.
- Capture viewport image.
- Render high-resolution image.
- Save output with timestamped filename.

## Important Design Decision

The MVP UI is English-only for now.

Chinese UI is planned, but MAXScript encoding needs real 3ds Max testing first. The project should avoid shipping bilingual UI until Chinese strings are proven not to corrupt across target Max versions.

## Next Best Step

Test the MVP in 3ds Max:

1. Download `dist/PerfectHDScreenshotPro_MVP.ms`.
2. Drag it into a 3ds Max viewport.
3. Test Detect Viewport.
4. Test Capture Viewport as PNG.
5. Test High-res Render at 1920x1080.
6. Paste any MAXScript error text back into the thread.

## After Runtime Test

If MVP works:

- Add version label.
- Add aspect-ratio lock.
- Add overwrite protection.
- Add lightweight log file.
- Start localization strategy.

If MVP fails:

- Fix MAXScript compatibility first.
- Do not add ComfyUI features yet.
