# AI Capture Purpose

The capture feature exists for **AI-readable certainty**, not for ordinary screenshots.

Users capture from DCC software because the 3D scene already contains reliable product information:

- real shape
- real proportions
- real camera angle
- real product relationship to space
- controllable material references
- animation or turntable motion
- renderable lighting context

## Product Goal

The tool should help artists convert DCC scenes into structured AI inputs.

```text
3D product / scene
-> evidence capture pack
-> AI recognition and generation
-> refined render / scene image / texture output
```

## Core AI Use Cases

### Multi-angle Product Recognition

Capture front, side, back, top, detail, and turntable frames.

Purpose:

- help AI understand product volume
- reduce hallucinated product details
- support consistent scene generation

### Subject Identification

Capture the main object separately from the full scene when possible.

Purpose:

- identify the product body
- create clean masks
- separate product from background

### Scene Image Generation

Use viewport or render captures as composition references.

Purpose:

- generate marketing scene images
- preserve product pose and camera angle
- test many environment styles quickly

### Animation Recognition

Capture key frames or turntable sequences.

Purpose:

- understand movement
- generate frame-consistent previews
- produce multi-angle AI reference sets

### Render Refinement

Use draft viewport or clay captures as AI inputs for refined imagery.

Purpose:

- improve lighting mood
- add detail while preserving structure
- create client-facing previews faster

### Texture and Material Creation

Capture UV, material regions, masks, or surface references.

Purpose:

- generate texture maps
- explore material variants
- prepare AI-assisted material studies

## Capture Pack Direction

The future AI Capture Pack should support these typed assets:

```text
viewport
beauty
clay
wireframe
depth
normal
mask
material_reference
texture_reference
multi_angle
animation_frame
camera_metadata
scene_metadata
```

The MVP starts with `viewport + metadata`.

Each new capture type must be useful to AI or client review. If it does not improve certainty, recognition, generation, refinement, or texture/material production, it should not be added yet.
