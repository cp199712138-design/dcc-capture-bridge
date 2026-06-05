# DCC Capture Bridge

**MVP product name:** Perfect HD Screenshot Pro

A lightweight 3ds Max capture tool today, designed as a future DCC-to-AI image control bridge for 3ds Max, Blender, and ComfyUI workflows.

## Current MVP

The first usable build is a single 3ds Max MAXScript file:

```text
dist/PerfectHDScreenshotPro_MVP.ms
```

Usage:

1. Download the `.ms` file.
2. Drag it into a 3ds Max viewport.
3. Use the floating panel to detect the active viewport, capture the viewport, or render a high-resolution image.

## MVP Features

- Drag-and-drop launch in 3ds Max.
- Detect active viewport resolution.
- Save the active viewport as an image.
- Render the active view/camera at a custom resolution.
- Output filenames include resolution and timestamp.
- Thin UI, reusable core API.

## Planned Direction

This project starts as a screenshot utility, but the long-term idea is broader:

```text
3ds Max / Blender scene
-> beauty / depth / normal / mask / camera metadata
-> ComfyUI workflow
-> AI image, material, and multi-angle variants
```

## Roadmap

```mermaid
flowchart TD
    A[3ds Max Capture MVP] --> B[GitHub single-file release]
    B --> C[ComfyUI health check]
    C --> D[Screenshot to AI img2img]
    D --> E[Depth / normal / mask control passes]
    E --> F[Multi-angle and material variants]
    F --> G[Blender adapter]
```

## Language Strategy

English is the primary development language for code, API names, GitHub issues, and release notes.

Chinese UI and documentation are planned and important, but MAXScript encoding can be fragile across Windows and 3ds Max versions. We will add bilingual UI carefully after testing the safest localization approach.

中文说明：这个项目第一阶段是 3ds Max 高清截图工具，后续计划扩展为 3ds Max / Blender 到 ComfyUI 的 AI 出图控制桥。代码和 GitHub 先以英文为主，中文界面会在确认编码方案后加入。

## Repository Name

Current repository name:

```text
perfect-hd-screenshot-pro
```

Suggested future name:

```text
dcc-capture-bridge
```

The current name is easier for screenshot users to understand. The future name better matches the AI pipeline direction.

## Status

Early MVP. Not yet widely tested across 3ds Max versions.
