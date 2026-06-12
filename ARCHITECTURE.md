# Perfect HD Screenshot Pro - Architecture

## 目标

这个版本不再把所有逻辑堆在一个 rollout 里。插件分成可替换的底层服务、应用协调层、UI 层和分发入口，后续扩展不会变成难维护的大脚本。

## 调研结论

- GitHub 上常见的 3ds Max 脚本分发方式有两类：
  - `.ms` 拖入 viewport 直接运行或安装，适合快速使用。
  - `.mcr` MacroScript 进入 3ds Max Customize UI，适合菜单、工具栏、快捷键。
- Autodesk 官方建议成熟插件用 `.bundle + PackageContents.xml` 放进 `ApplicationPlugins`，适合正式发布和版本化。
- 视口截图的底层边界很明确：`viewport.getViewportDib()` / `gw.getViewportDib()` 拿到的是当前活动视口真实像素，不应该假装成高清。
- 真正高清输出应该走 `render outputwidth: outputheight:`，并显式关闭 bitmap，避免连续输出时内存堆积。

## 分层

```text
PerfectHDScreenshotPro/
  PerfectHDScreenshot_Open.ms          # 拖入 3ds Max 视口直接打开
  PackageContents.xml                  # 预留正式 bundle 发布入口
  src/
    PHDS_Loader.ms                     # 模块加载顺序
    core/
      PHDS_Config.ms                   # 版本、默认值、格式、限制
      PHDS_Result.ms                   # 统一成功/失败返回结构
      PHDS_Request.ms                  # 截图请求数据结构
      PHDS_PathService.ms              # 路径、文件名、目录校验
      PHDS_ViewportService.ms          # 视口识别、视口截图
      PHDS_RenderService.ms            # 高清渲染输出
      PHDS_AppService.ms               # 用例编排，不包含 UI 细节
    ui/
      PHDS_MainRollout.ms              # 窗口和事件绑定
```

## 依赖方向

```text
UI -> AppService -> PathService
                -> ViewportService
                -> RenderService
                -> Result / Request / Config
```

规则：

- UI 只负责读控件、显示状态、调用 AppService。
- AppService 只编排业务流程，不知道按钮、spinner、checkbox。
- PathService 只处理目录和文件名。
- ViewportService 只处理 viewport DIB 和尺寸识别。
- RenderService 只处理 render 输出。
- 每个底层服务返回 `PHDS_Result`，不要到处弹 messageBox。

## 核心数据流

### 识别视口分辨率

```text
UI Detect Button
  -> AppService.detectViewport()
  -> ViewportService.detectSize()
  -> Result(value: [width, height])
  -> UI updates spinners and status
```

### 保存当前视口截图

```text
UI Save Button
  -> Request(mode:#viewport, width, height, folder, prefix, format)
  -> AppService.save(request)
  -> ViewportService.capture()
  -> PathService.buildOutputFile()
  -> bitmap save/close
  -> Result(value: outputFile)
```

### 保存高清渲染

```text
UI Save Button
  -> Request(mode:#render, width, height, folder, prefix, format)
  -> AppService.save(request)
  -> PathService.buildOutputFile()
  -> RenderService.renderToFile()
  -> close returned bitmap
  -> Result(value: outputFile)
```

## 后续扩展点

- PresetRepository：保存常用分辨率、命名规则、默认目录。
- CameraBatchService：批量输出所有相机。
- RendererAdapter：针对 V-Ray、Corona、Arnold 增加特定参数。
- OutputFormatService：增加 EXR、TGA、16-bit、透明背景策略。
- ViewportModeService：切换 clay、wireframe、edged faces 等视口状态，并在结束后恢复。
- Dockable UI：后期可把 rollout 升级为 dockable dialog。

## 参考资料

- Autodesk MAXScript MacroScript 文档：MacroScript 用于菜单、工具栏和快捷键，UI 需要 rollout/floater 单独创建。
- Autodesk MAXScript Rollout 文档：rollout 是 MAXScript 工具 UI 的标准方式。
- Autodesk Application Plug-in Package 文档：正式发布建议 `.bundle + PackageContents.xml`。
- Autodesk Render 文档：`render()` 支持 `outputwidth`、`outputheight`、`outputfile`，返回 bitmap 时要关闭释放内存。
- Autodesk Viewport 文档：`gw.getViewportDib` / `viewport.getViewportDib` 捕获活动视口。
- GitHub `ADN-DevTech/3dsMax-Python-HowTos` quickpreview：示例里通过获取视口尺寸、抓 viewport DIB、保存 bitmap、close bitmap、gc 清理内存。
