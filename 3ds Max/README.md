# 3ds Max

3ds Max 端插件实现。

当前版本使用 MAXScript macro package：

- 包路径：`HDViewportCapture.bundle`
- 宏类别：`HD Viewport Capture`
- 支持格式：PNG、JPG、TIF、BMP
- 支持活动视口像素截图
- 支持把截图保存为视口原始尺寸，或另存为重采样后的 bitmap 尺寸

## Capture Boundary

3ds Max 端必须区分两种输出：

- Viewport pixel capture: 使用活动视口的真实屏幕像素。它适合给 Instant Canvas
  当作当前构图、材质、选区和视角证据，但它不是离线渲染，也不会因为文件尺寸变大而获得真实渲染质量。
- True high-resolution render output: 使用 3ds Max 当前 renderer 和 Render Setup
  生成指定分辨率图片。它可以是真正高分辨率，但质量取决于场景、灯光、材质和渲染器设置。

`HDViewportCapture.bundle` 当前是轻量 viewport 工具；如果用户输入自定义输出尺寸，它只能保存重采样后的 bitmap，
不能声称生成了高质量 render。

## Instant Canvas Evidence Packet

Instant Canvas 需要 3ds Max adapter 至少提供以下证据字段：

- `packet_version`: `instant_canvas.dcc_evidence.v1`
- `dcc`: `3ds Max`
- `adapter`: `3dsmax`
- `capture_family`: `viewport_pixel_capture` 或 `renderer_output`
- `asset_type`: `viewport` 或 `beauty_render`
- `image_path`: 本地输出图片路径
- `image_width` / `image_height`: 实际写入图片尺寸
- `viewport_width` / `viewport_height`: 捕捉时活动视口尺寸，render 输出可为空
- `requested_width` / `requested_height`: 用户请求尺寸，viewport 捕捉必须说明是否被忽略或仅用于重采样
- `camera_or_viewport`: 活动视口名、camera 名，或 `active_viewport`
- `selected_object_intent`: 当前选区意图；MVP 可写 `unknown`
- `material_notes`: 材质/贴图提示；MVP 可写 `not_captured_in_mvp`
- `quality_claim`: 必须如实写 `viewport_pixels_only` 或 `renderer_output_from_current_render_setup`
- `drag_drop_mvp_compatible`: `true` / `false`

安装脚本在 `测试发布/install-3dsmax.ps1`。
