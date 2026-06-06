# Contracts

Contracts define stable data shapes shared by 3ds Max, Blender, ComfyUI, and future tools.

The most important contract is the capture session:

```text
capture session = typed assets + source metadata + AI workflow metadata
```

Do not put software-specific API details in this folder.

The schema file here is the target shape for future `metadata.json` output.
