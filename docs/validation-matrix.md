# Validation Matrix

## MVP Runtime Tests

| Area | Test | Expected Result | Status |
| --- | --- | --- | --- |
| Launch | Drag `.ms` into 3ds Max viewport | Rollout opens | Not tested |
| Relaunch | Drag again while window is open | Old window closes, new opens | Not tested |
| Viewport | Click Detect Viewport | Width/height update | Not tested |
| Snapshot | Save viewport PNG | File appears in output folder at real viewport size | Not tested |
| Render | Run Production Render | Rendered file appears using current Render Setup | Not tested |
| Render Setup | Click Open Render Setup | Native 3ds Max Render Setup opens | Not tested |
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
| Blender | 4.2 LTS | Future high | Planned |
| Blender | Latest stable | Future high | Planned |

## AI-readable Capture Tests

| Test | Expected Result | Status |
| --- | --- | --- |
| Subject clarity | Main object is visible and not blocked by UI | Planned |
| Silhouette clarity | AI can read object outline | Planned |
| No UI contamination | No unwanted toolbars or panel overlays in output | Planned |
| Img2img smoke test | ComfyUI output preserves main subject structure | Planned |
| Control pass alignment | depth/normal/mask align with beauty image | Future |
| Metadata | Capture includes size, type, DCC, timestamp | Future |

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
| Missing node behavior | UI reports missing node clearly | Planned |

## Demo Proof Tests

| Demo | Proof Required | Status |
| --- | --- | --- |
| Viewport Snapshot MVP | Saved image + Max version + panel screenshot | Planned |
| Production Render Mode | Saved render + note current renderer | Planned |
| Manual ComfyUI img2img | Source capture + generated output | Planned |
| ComfyUI Health Check | API response + UI status | Future |
