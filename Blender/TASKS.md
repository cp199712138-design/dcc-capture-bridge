# Blender Thread Tasks

Owner thread: `Instant Canvas 即时画布 / 05 Blender`

## Scope

Owns future Blender adapter planning and parity with the 3ds Max evidence packet.

Primary files:

- `Blender/README.md`
- `development/04-dcc-adapters/README.md`
- `docs/dcc-adapter-architecture.md`

## Do Not Touch

- 3ds Max implementation files.
- Browser UI or server files.
- New Blender add-on code before the evidence packet is stable.

## First Assignment

Define Blender parity requirements against the 3ds Max evidence packet:

- viewport or camera source
- selected object identity
- material notes
- mask or region intent
- output size and aspect ratio
- handoff URL or local file exchange strategy

This first pass is planning and contract alignment only.

## Verification

Run:

```powershell
Get-Content Blender\README.md -Encoding UTF8
Get-Content docs\dcc-adapter-architecture.md -Encoding UTF8
```

## Report Format

```text
STATUS:
FILES CHANGED:
VERIFICATION:
RISKS:
NEXT:
```
