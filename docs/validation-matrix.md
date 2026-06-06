# Validation Matrix

## MVP Runtime Tests

| Area | Test | Expected Result | Status |
| --- | --- | --- | --- |
| Launch | Drag `.ms` into 3ds Max viewport | Rollout opens | Not tested |
| Relaunch | Drag again while window is open | Old window closes, new opens | Not tested |
| Viewport | Click Detect Viewport | Width/height update | Not tested |
| Capture | Save viewport PNG | File appears in output folder | Not tested |
| Render | Save high-res render | Rendered file appears | Not tested |
| Folder | Choose custom folder | Output goes to selected folder | Not tested |
| Format | PNG/TIF/JPG/BMP | Correct extension and readable file | Not tested |
| Error | No active viewport | Clear error message | Not tested |

## Compatibility Targets

| Software | Version | Priority | Status |
| --- | --- | --- | --- |
| 3ds Max | 2022 | Medium | Unknown |
| 3ds Max | 2023 | Medium | Unknown |
| 3ds Max | 2024 | High | Unknown |
| 3ds Max | 2025 | High | Unknown |
| 3ds Max | 2026 | High | Unknown |

## Localization Tests

| Test | Expected Result | Status |
| --- | --- | --- |
| English default UI | All labels readable | Planned |
| Chinese UI strings | No mojibake in 3ds Max | Planned |
| Chinese paths | Save works with Chinese folder names | Planned |
| Unicode filenames | Output file can be saved/read | Planned |

## Future ComfyUI Tests

| Test | Expected Result | Status |
| --- | --- | --- |
| Server ping | ComfyUI reachable | Planned |
| `/system_stats` | Returns JSON | Planned |
| `/object_info` | Required nodes found | Planned |
| Upload image | Image appears in ComfyUI input | Planned |
| Submit workflow | Prompt id returned | Planned |
| Fetch result | Output image path returned | Planned |
