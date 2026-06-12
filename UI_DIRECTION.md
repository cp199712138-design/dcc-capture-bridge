# UI Direction

## 先纠正方向

上一张概念图的问题：

- 太普通，像套了暗色模板。
- 没有 DCC 软件的专业密度。
- 没有“截图/渲染输出工具”的产品识别。
- 控件关系不够清楚，像一个泛用设置面板。
- 缺少适合长期使用的视觉系统。

这个工具的 UI 不应该追“网页好看”，而应该追：

```text
专业创作软件感 + 输出控制台 + 轻量画布预览
```

## 参考方向对比

| 方向 | 适合度 | 为什么 |
| --- | --- | --- |
| Minimal / Swiss Tool UI | 高 | 信息清楚、寿命长、适合 DCC 插件 |
| Pro App / Command Panel | 高 | 像专业软件，不像网页模板 |
| AI-Native Copilot UI | 中 | 可用于后期“推荐输出设置”，但第一版不能过度 AI 味 |
| Bento Dashboard | 中 | 可用于历史和批量队列，不适合第一屏核心操作 |
| Glassmorphism / Liquid Glass | 低 | DCC 里容易显得玩具化、影响扫读 |
| Cyberpunk / HUD | 低 | 很容易土，除非做游戏内 FUI，不适合生产工具 |
| Neumorphism / Claymorphism | 很低 | 不适合 3ds Max / Blender 这种专业环境 |

## 推荐主风格

### Precision Studio UI

关键词：

```text
graphite, calibrated, compact, technical, tactile, non-decorative
```

视觉感觉：

- 像 Blender/DaVinci/Adobe/Resolve/Figma dev mode 的混合气质。
- 暗色但不是全黑。
- 高对比但不刺眼。
- 控件密度比网页高。
- 信息层级靠线、间距、字号、状态色，而不是大卡片。

## 第一版 UI 应该长这样

```text
┌ Perfect HD Screenshot Pro ─────────────────────┐
│ Viewport  Render  Batch                         │  顶部模式切换
├────────────────────────────────────────────────┤
│ Preview                                         │
│ ┌────────────────────────────────────────────┐  │
│ │ 当前视口缩略预览 / 暂无预览               │  │
│ └────────────────────────────────────────────┘  │
├────────────────────────────────────────────────┤
│ Resolution                                      │
│ [Viewport] [2x] [4K] [8K] [Custom]              │
│ W [ 1920 ]   H [ 1080 ]   Ratio [lock]          │
├────────────────────────────────────────────────┤
│ Output                                          │
│ Format [PNG v]   Alpha [ ]   Gamma [x]          │
│ Folder [D:\shots........................] [...] │
├────────────────────────────────────────────────┤
│ Status: Ready                      [Save Image] │
└────────────────────────────────────────────────┘
```

注意：

- 顶部用 segmented tabs，不用左侧大导航，第一版窗口小，左侧导航浪费空间。
- 预览区可以先是占位，后续再接真实 viewport thumbnail。
- 预设按钮要像专业工具里的 toggle chip，别像网页 tag。
- 保存按钮要明显，但不能像营销 CTA。

## 画布版以后再做

如果后面做成“画布一样的”，那是第二形态：

```text
┌────────────────────────────────────────────────────────┐
│ Modes / Cameras    Preview Canvas        Inspector     │
│                  ┌──────────────┐       Resolution     │
│ Viewport         │              │       Output         │
│ Render           │   thumbnail  │       Color          │
│ Batch            │              │       Queue          │
│                  └──────────────┘                      │
│ Recent Outputs / Queue                                 │
└────────────────────────────────────────────────────────┘
```

这个适合：

- 批量相机
- 输出历史
- 对比截图
- 多预设
- 渲染队列

不适合第一版，否则会拖慢底层稳定。

## 颜色系统

```text
Background: #17191d
Panel:      #202329
Raised:     #272b32
Border:     #343943
Text:       #e6e8ec
Muted:      #9aa3ad
Accent:     #6aa6ff
Success:    #6bd692
Warning:    #f4b860
Error:      #ff6b6b
```

不要：

- 大面积紫蓝渐变
- 玻璃发光
- 圆滚滚卡片
- 花哨背景

## 字体和密度

3ds Max MAXScript rollout 里字体控制有限，所以第一版重点是：

- 控件分组清楚。
- 对齐干净。
- 标签短。
- 密度高但不挤。

如果后面做 Blender / Qt / WebView UI，再考虑更完整的字体系统：

```text
Inter / Geist / IBM Plex Sans
Monospace numbers for resolution and file sizes
```

## 从热门 UI skill 里吸收什么

UI UX Pro Max 的价值不在“套最炫风格”，而在：

- 先判断产品类型。
- 再选设计系统。
- 再定颜色、字体、布局、反模式。

对这个工具，产品类型应该判为：

```text
Creative professional tool / DCC utility / rendering workflow helper
```

所以不选 glassmorphism、aurora、cyberpunk、neumorphism。

选择：

```text
Minimal + Pro App + Dark Mode + Technical Dashboard
```

Anthropic frontend-design 的价值更偏：

- 视觉层级
- 组件细节
- 避免 AI 味
- 可访问性和真实产品感

这里要吸收的是“像真实工具”，不是“生成漂亮网页”。

## 下一张预览图要求

如果要重新生成 UI 概念图，prompt 应该明确：

```text
Professional DCC utility panel, compact graphite UI, no marketing layout,
no glassmorphism, no neon, no gradient blobs, no oversized cards.
Looks like a screenshot tool built for Blender/3ds Max artists.
Top segmented modes, central preview, dense inspector controls,
recent outputs as narrow rows, calibrated technical aesthetic.
```

## 当前结论

最适合这个项目的不是“最夯 UI”，而是：

```text
当前流行设计系统方法 + 专业 DCC 工具审美
```

要看起来新，但不能像 AI 网页模板。
