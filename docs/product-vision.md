# Product Vision

## Core Idea

DCC Capture Bridge is a bridge between 3D creation tools and AI image workflows.

The first visible feature is screenshot capture, but the deeper product goal is controlled visual handoff:

```text
DCC scene -> structured capture assets -> AI workflow -> reviewed output
```

## Why This Matters

Artists already use screenshots, viewport captures, clay renders, depth maps, and reference images as inputs to AI tools. The painful part is that the handoff is usually manual, inconsistent, and hard to repeat.

This tool should make that handoff repeatable.

## User Types

### 1. 3ds Max / Blender artist

Wants fast output from a viewport or camera without wrestling with render settings.

### 2. Concept designer

Wants to turn a blockout or model into styled images, material ideas, and mood variants.

### 3. Material / lookdev artist

Wants to generate or explore material treatments while preserving geometry cues.

### 4. AI workflow user

Wants DCC-generated control inputs for ComfyUI without rebuilding every step manually.

## Product Shape

### Stage 1: Capture Tool

```text
Detect viewport -> capture / render -> save image
```

### Stage 2: Capture Bridge

```text
Capture beauty/depth/normal/mask -> upload to ComfyUI -> run workflow
```

### Stage 3: Review Workspace

```text
Compare variants -> save decisions -> rerun with adjusted params
```

### Stage 4: Multi-DCC Bridge

```text
3ds Max adapter + Blender adapter + shared workflow concepts
```

## Non-goals

- Do not become a full ComfyUI replacement.
- Do not become a general render manager.
- Do not hide all AI parameters behind a black box.
- Do not overbuild the first 3ds Max UI.

## North Star

A user should be able to say:

> I have a scene. Give me reliable visual inputs for AI, then help me generate and compare useful design directions.
