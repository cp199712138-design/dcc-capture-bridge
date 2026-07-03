# 3ds Max Thread Tasks

Owner thread: `Instant Canvas 即时画布 / 04 3ds Max`

## Scope

Owns 3ds Max capture adapter, MAXScript package, capture metadata, MVP script compatibility, and truthful viewport/render terminology.

Primary files:

- `3ds Max/README.md`
- `3ds Max/HDViewportCapture.bundle/`
- `development/04-dcc-adapters/README.md`
- `src/PHDS_Loader.ms`
- `src/core/*.ms`
- `src/ui/PHDS_MainRollout.ms`
- `src/adapters/3dsmax/DCC_3dsMaxAdapter.ms`
- `dist/PerfectHDScreenshotPro_MVP.ms`
- `docs/dcc-adapter-architecture.md`

## Do Not Touch

- Browser canvas UI except documented DCC packet expectations.
- API server code unless the evidence packet contract changes and API thread is notified.
- Blender files.

## First Assignment

Audit the 3ds Max adapter boundary:

- distinguish viewport pixel capture from true high-resolution render output
- document the exact evidence packet needed by Instant Canvas
- keep drag/drop MVP path testable
- avoid claiming fake render quality

Repair docs or MAXScript code only when the issue is clear from current files.

## Verification

Run static checks:

```powershell
Get-ChildItem src\core,src\ui,src\adapters\3dsmax,'3ds Max' -Recurse -File
```

If 3ds Max is used manually, report the exact version, command path, and observed result.

## Report Format

```text
STATUS:
FILES CHANGED:
VERIFICATION:
RISKS:
NEXT:
```
