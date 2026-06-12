# GitHub Upload Checklist

## 上传前确认

第一版先上传这些：

```text
README.md
START_PLAN.md
PRODUCT_UI_SYSTEM.md
AI_PIPELINE_PLAN.md
COMPETITOR_SCAN.md
dist/PerfectHDScreenshotPro_MVP.ms
```

可以暂时不上传：

```text
旧 PerfectHDScreenshot/
generated images
临时测试输出
ComfyUI 目录
```

## 第一版 README 要写清楚

必须说明：

- 这是 3ds Max MVP。
- 直接拖入 `PerfectHDScreenshotPro_MVP.ms` 可以打开。
- 默认英文，支持中文切换。
- 当前只支持 Capture / Render。
- ComfyUI / Blender / AI workflow 是后续计划。
- 还没有经过大量 3ds Max 版本测试。

## 发布包策略

第一阶段只发布单文件：

```text
dist/PerfectHDScreenshotPro_MVP.ms
```

用户使用方式：

```text
Drag the .ms file into a 3ds Max viewport.
```

后续成熟再做：

```text
PerfectHDScreenshotPro.bundle
```

## GitHub 仓库建议名

```text
perfect-hd-screenshot-pro
```

或者更长期一点：

```text
dcc-capture-bridge
```

如果你想先对外明确是截图工具，选第一个。
如果你想提前占住未来 AI 管线定位，选第二个。
