# Competitor / Similar Project Scan

## Summary

Similar work exists mainly around Blender + ComfyUI + AI texture generation. 3ds Max integrations are much less common, which makes the 3ds Max capture bridge a useful starting point.

## Representative Projects

### StableGen

GitHub: https://github.com/sakalond/StableGen

Blender add-on with ComfyUI backend for AI 3D generation, scene-wide texturing, multi-view consistency, ControlNet, IPAdapter, PBR decomposition, presets, and output folder management.

Lessons:

- Multi-view and camera strategy are important later.
- Output folders need strong structure.
- Presets and troubleshooting matter.
- It is too large to copy for our MVP.

### ComfyUI-BlenderAI-node

GitHub: https://github.com/AIGODLIKE/ComfyUI-BlenderAI-node

A Blender add-on that brings ComfyUI nodes into Blender. Supports camera input, viewport input, masks, depth, materials, batching, and ComfyUI launch/connect configuration.

Lessons:

- Installation and custom node compatibility are major user pain points.
- Health checks and clear setup feedback are necessary.
- We should not rebuild the full ComfyUI node editor inside DCC.

### Texture Diffusion

GitHub: https://github.com/Shaamallow/texture-diffusion

Blender add-on using ComfyUI for diffusion texture generation, depth ControlNet, IPAdapter, LoRA, inpainting, UV projection, and masking.

Lessons:

- Current-view generation is a natural first AI step.
- Depth maps are a key control pass.
- Multi-view and multi-object workflows should come later.

## Differentiation

This project should focus on:

- 3ds Max first.
- Lightweight capture and control-pass export.
- Future Blender adapter.
- ComfyUI workflow control, not node editing.
- Versioned workflow templates.
