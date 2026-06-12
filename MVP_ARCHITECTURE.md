# MVP Architecture

## 先做最简单版本

第一版只解决一件事：在 3ds Max 里稳定输出一张图。

不要先做复杂画布、不要先接一堆渲染器、不要先做大插件系统。底层先抽干净，UI 先保持很薄。

## 最小结构

```text
UI
  -> ScreenshotAPI
      -> captureViewport()
      -> renderImage()
      -> detectViewportSize()
      -> buildOutputPath()
```

核心思想：

- UI 只负责按钮和输入框。
- ScreenshotAPI 是以后最重要的接口层。
- 真正干活的函数先保持少，但命名要稳定。
- 后面无论做成小插件、开放接口、还是 Max 内画布，都调用同一套 ScreenshotAPI。

## 第一阶段只保留 4 个能力

1. `detectViewportSize()`
   - 返回当前活动视口宽高。
   - 不弹窗，只返回结果。

2. `captureViewport(request)`
   - 保存当前视口真实像素。
   - 不假高清，不拉伸。

3. `renderImage(request)`
   - 用当前渲染器按指定宽高输出。
   - 用于 2K、4K、8K 或自定义。

4. `buildOutputPath(request)`
   - 统一命名、格式、目录。
   - 避免 UI 里拼路径。

## 后面三个方向先这样看

### 方向 A：做成接口

适合以后让别的脚本调用：

```maxscript
PHDS.captureViewport width:1920 height:1080 folder:@"D:\shots"
PHDS.renderImage width:3840 height:2160 format:"png"
```

优点：底层最干净，后续好接批量相机、自动化、外部流程。

### 方向 B：做成单独小插件

适合当前最实用：

```text
拖入 .ms -> 打开小窗口 -> 选尺寸 -> 保存
```

优点：最快能用，复杂度低。

### 方向 C：做成 Max 里的画布工具

类似截图工作台：

```text
左边预设/相机/历史
中间预览画布
右边输出参数
```

优点：体验最好，但最容易变复杂。应该等 ScreenshotAPI 稳了以后再做。

## 当前建议

先按 B 做一个小插件，但底层按 A 的接口方式写。

也就是：

```text
第一版外观 = 小插件
第一版底层 = 可复用接口
未来升级 = 可以接画布
```

这样最稳，不容易写成屎山。

## 不做的事

第一版暂时不做：

- 不做复杂 Dock UI。
- 不做批量相机。
- 不做历史库。
- 不做预览画布。
- 不做渲染器专用适配。
- 不做自动安装器。

这些都等核心接口跑稳之后再加。
