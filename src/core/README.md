# Core

Core code owns product behavior that should survive a move from 3ds Max to Blender.

It should understand:

- capture requests
- capture sessions
- output folders
- metadata
- asset types

It should not understand:

- MAXScript rollout controls
- Blender panel controls
- ComfyUI node IDs
- 3ds Max viewport APIs
- Blender `bpy` calls

The current MVP still ships as one drag-and-drop `.ms` file in `dist/`, but the source direction is adapter-based.
