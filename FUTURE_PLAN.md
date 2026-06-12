# Future Plan: 3ds Max First, Blender Later

## 核心判断

这个工具不要写成“3ds Max 截图脚本”，而要写成“DCC 截图/输出核心 + 宿主适配器”。

第一版宿主是 3ds Max。未来迁移 Blender 时，只换宿主适配层，不重写业务核心。

## 长期结构

```text
Core
  - ScreenshotRequest
  - OutputPath
  - Preset
  - Result
  - Validation

Host Adapter
  - MaxAdapter
  - BlenderAdapter

UI
  - Compact Tool
  - Canvas Workspace
  - Batch Panel
```

## 3ds Max 和 Blender 的对应关系

| 能力 | 3ds Max | Blender |
| --- | --- | --- |
| 插件入口 | `.ms` / `.mcr` / `.bundle` | `.py` add-on / extension |
| UI 面板 | MAXScript rollout | `bpy.types.Panel` |
| 命令/动作 | MacroScript / functions | `bpy.types.Operator` |
| 偏好设置 | ini/json/自定义文件 | `AddonPreferences` |
| 视口截图 | `viewport.getViewportDib()` / `gw.getViewportDib()` | viewport OpenGL / screenshot operator |
| 高清渲染 | `render outputwidth: outputheight:` | scene render settings + `bpy.ops.render.render()` |
| 路径管理 | MAXScript pathConfig | Python pathlib / bpy paths |

## 迁移到 Blender 时的原则

- 不照搬 MAXScript 文件结构。
- 保留概念接口：detect / capture / render / output path / preset。
- Blender 版用 Python package 结构，不做单文件巨脚本。
- Blender UI 使用原生面板和 operator，保持和 Blender 交互习惯一致。
- 如果后续做画布，画布逻辑独立，不绑定 3ds Max 或 Blender。

## UI 方向

目前更适合这个工具的 UI 不是营销感、不是大卡片，而是专业 DCC 工具 UI：

- 深色优先，但必须支持浅色/系统主题。
- 左侧或顶部是输出模式：Viewport / Render / Batch。
- 中间是预览或状态区域。
- 右侧或下方是参数：尺寸、格式、路径、透明、Gamma、渲染器。
- 常用预设一键可达：Viewport、2x、4K、8K、自定义。
- 输出结果有历史列表：最近文件、打开目录、复制路径。
- 高风险操作有明确提示：8K、透明、覆盖文件、批量渲染。

## 最夯但要克制使用的 UI 趋势

可以吸收：

- AI-assisted workflow：未来可以加“根据用途推荐输出设置”，比如电商主图、作品集、移动端封面。
- Command palette：类似搜索命令，适合高级用户。
- Token-based design system：颜色、间距、字号、控件密度统一，方便 Max/Blender 两端保持一致气质。
- Progressive disclosure：简单模式只显示 5 个关键项，高级模式再展开色彩管理、透明、渲染器细节。
- Dark-first professional UI：DCC 用户常在深色界面里工作，默认深色更自然。

暂时不要做：

- 太强的玻璃拟态、渐变、装饰光效。
- 花哨动画。
- 大面积卡片式网页 UI。
- AI 自动生成一切的黑盒流程。

## 三种产品形态

### 1. 接口优先

适合自动化和后期迁移。

```text
PHDS.captureViewport(request)
PHDS.renderImage(request)
PHDS.detectViewportSize()
```

这是底座，必须先稳。

### 2. 单独小插件

适合最快落地。

```text
拖入/安装 -> 小窗口 -> 保存图
```

第一版建议用这个形态。

### 3. 画布工作台

适合最终高级版。

```text
预览画布 + 输出预设 + 历史 + 批量队列 + 相机管理
```

这个先不要急着做。等接口和小插件跑稳，再升级。

## 下一步建议

先把 3ds Max MVP 做成：

```text
接口层稳定
UI 很薄
拖入可用
保存可靠
```

然后我们再一起决定：

1. 继续强化小插件。
2. 先抽公共接口。
3. 直接设计画布工作台。
4. 预留 Blender Python package 结构。
