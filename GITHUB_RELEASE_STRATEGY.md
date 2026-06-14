# GitHub Release Strategy

## Instant Canvas Customer-Test Build

当前网页主线按客户测试版处理：

```text
source branch -> smoke pass -> GitHub push -> GitHub Pages/customer URL
```

发布前必须确认：

```powershell
node capture-canvas/check-page.mjs --all
```

若需要分项定位，使用：

```powershell
node capture-canvas/check-page.mjs
node capture-canvas/simulate-flow.mjs
node capture-canvas/test-api-contract.mjs
node capture-canvas/browser-smoke.mjs
```

客户测试版 release notes 固定结构：

```text
Build:
Commit:
URL:
Ready:
Preview-only:
Provider/API setup:
Known limits:
Verification:
Customer steps:
Rollback:
```

Secret scan 只拦截真实 key，不拦截 `sk-...` 占位符：

```powershell
rg 'sk-(?!\.\.\.)(?!test\b)(?:proj-)?[A-Za-z0-9_-]{20,}' . -g '!node_modules' -g '!.git' -g '!.env' -g '!.env.*'
```

## 目标

后续代码会变多，但不能变乱，也不能让用户每次手动找一堆文件。

最终目标是：

```text
GitHub 上维护源码
本地开发完成
打包成一个发布文件
用户直接覆盖旧版
```

## 控制体积的原则

### 源码可以分层

源码目录可以拆开，方便维护：

```text
src/
  core/
  adapters/
  ui/
  presets/
```

但用户使用时不应该面对复杂目录。

### 发布包要简单

发布给用户时，只给一个主入口：

```text
PerfectHDScreenshotPro.ms
```

或者正式版：

```text
PerfectHDScreenshotPro.bundle
```

用户不需要知道内部有多少模块。

### 不把资源塞进脚本

禁止把大图、预览图、base64、测试文件塞进 `.ms`。

允许：

- 少量图标
- 配置 JSON
- 默认预设

不允许：

- 大截图
- 视频
- 临时渲染图
- AI 生成图原图
- 大量测试输出

## GitHub 仓库建议结构

```text
perfect-hd-screenshot/
  README.md
  CHANGELOG.md
  LICENSE
  docs/
    architecture.md
    ui-plan.md
    blender-migration.md
  max/
    src/
      core/
      adapters/
      ui/
    scripts/
      PerfectHDScreenshot_Open.ms
    bundle/
      PackageContents.xml
  blender/
    README.md
    addon/
      __init__.py
  build/
    build-max-release.ps1
  dist/
    PerfectHDScreenshotPro.ms
    PerfectHDScreenshotPro.bundle.zip
```

## 覆盖安装策略

第一阶段用最简单方式：

```text
下载 PerfectHDScreenshotPro.ms
拖入 3ds Max
新版覆盖旧的全局函数和 UI
```

脚本启动时必须做：

```maxscript
try (destroyDialog PHDS_MainRollout) catch()
global PHDS
global PHDS_Version
```

这样用户重复拖入新版时，不会残留旧窗口。

第二阶段做正式安装：

```text
PerfectHDScreenshotPro.bundle
复制到 ApplicationPlugins
重启 3ds Max
```

新版发布时直接覆盖同名 bundle。

## 版本规则

使用语义版本：

```text
0.1.0  最小可用版
0.2.0  接口稳定
0.3.0  UI 改进
0.4.0  批量/历史/预设
1.0.0  稳定公开版
```

脚本里也保留版本号：

```maxscript
PHDS.version = "0.2.0"
```

启动时如果发现旧版本全局对象，直接覆盖。

## 分支策略

```text
main        稳定可下载
dev         日常开发
feature/*   单个功能
```

每次准备给用户试用时，从 `dev` 打包到 `dist/`，再合并到 `main`。

## 防止屎山的规则

- UI 文件不能直接保存 bitmap。
- UI 文件不能直接拼输出路径。
- UI 文件不能直接调用 render。
- Core 文件不能弹 messageBox。
- 每个服务只做一类事。
- 单个 `.ms` 源码文件超过 300 行就考虑拆分。
- 发布文件可以是合并后的单文件，但源码必须保持分层。

## 未来 Blender 迁移

GitHub 仓库里提前保留：

```text
blender/addon/
```

但一开始不写 Blender 代码，只写迁移计划。

等 3ds Max 版核心接口稳定后，再把概念映射到 Blender：

```text
MaxAdapter      -> BlenderAdapter
MAXScript UI    -> bpy.types.Panel
MAXScript action -> bpy.types.Operator
```

这样不会让 Max 版和 Blender 版互相污染。

## 当前建议

现在不要急着做大 UI，也不要急着写 Blender。

先做：

```text
一个干净源码结构
一个单文件发布构建
一个可重复覆盖的拖入脚本
```

这三件事做好，后面变大也不会乱。
