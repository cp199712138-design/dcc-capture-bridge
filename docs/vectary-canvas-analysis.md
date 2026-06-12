# Vectary Canvas Analysis

This is not a clone target. It is a direction reference.

## What Vectary Is Selling

Vectary is not selling a screenshot tool.

It is selling a connected 3D product workflow:

```text
Canvas -> Studio -> Workspaces -> Share / AR / Embed
```

The public positioning focuses on:

- AI-accelerated ideation
- interactive 3D and AR presentations
- browser-based, no-code workflows
- team collaboration
- product communication from concept to market-ready output

## Important Product Pattern

Vectary Canvas appears to turn the design process into a visual workspace:

```text
3D / sketch / references
-> AI concept exploration
-> material and detail refinement
-> interactive 3D presentation
-> shareable output
```

The most important pattern is **not** one button.

The important pattern is a workspace where input, references, generated variants, and product context stay visible together.

## Vectary GenAI Patterns To Learn From

### 3D Canvas As AI Input

Vectary's 3D-to-image flow uses the current 3D canvas as a live reference, optional image references, and a text prompt.

For our project, this maps to:

```text
DCC viewport / render / masks
optional references
prompt
-> AI output
```

### Reference Slots

Vectary uses a canvas slot plus optional image slots.

For our project:

```text
slot 1: DCC capture
slot 2: material/style reference
slot 3: scene/mood reference
```

### History And Comparison

Generated outputs are saved into history for review and comparison.

For our project:

```text
capture session
  -> ai/history
  -> variants
  -> chosen result
```

### 2D To 3D And Textured Models

Vectary's AI page emphasizes dragging a product image onto the canvas to generate a textured 3D model, then refining materials, lighting, interactions, AR, and sharing.

For our project, the parallel is different:

```text
existing 3D scene in 3ds Max / Blender
-> AI-readable evidence pack
-> scene image / material / texture / refinement outputs
```

We should not try to become a full browser 3D editor first.

## Where We Should Differ

Vectary owns the browser 3D editor and AR sharing lane.

Our stronger wedge is:

```text
professional DCC scene
-> trusted multi-angle evidence
-> AI control assets
-> ComfyUI / image model workflow
```

This matters because 3ds Max and Blender users already have complex scenes, cameras, materials, animation, and product geometry.

The product should extract this certainty instead of asking users to rebuild it in a browser.

## Product Direction For Instant Canvas

The future UI should become a local or web-based Capture Canvas:

```text
left: capture sources
  - viewport
  - camera
  - selected object
  - material region
  - animation range

center: evidence board
  - current capture
  - multi-angle strip
  - masks / control passes
  - reference slots

right: AI tasks
  - scene generation
  - render refinement
  - material variation
  - texture creation
  - subject isolation

bottom: history
  - captured packs
  - AI variants
  - selected outputs
```

## Immediate MVP Implication

The 3ds Max `.ms` file should stay small.

It should only do:

- capture real viewport evidence
- write structured metadata
- open the session folder
- hand off to the future Capture Canvas

The modern UI should not be forced into MAXScript rollout controls.

## Next Build Proposal

1. Keep `dist/PerfectHDScreenshotPro_MVP.ms` as a lightweight DCC capture launcher.
2. Add a local `capture-canvas` prototype as an HTML/React app.
3. Let the Max plugin write capture sessions.
4. Let the canvas app load a session folder and show:
   - source image
   - metadata
   - reference slots
   - future ComfyUI task buttons
5. Later connect ComfyUI and Blender through adapters.

