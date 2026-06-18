# 客户测试说明

本轮客户测试只覆盖 Instant Canvas 网页原型。3ds Max、Blender 本轮冻结，ComfyUI 不在本轮开发范围内。

## 启动

从项目根目录运行：

```powershell
node serve-static.mjs
```

打开：

```text
http://127.0.0.1:8765/capture-canvas/index.html
```

默认是 `Mock` / 本地预览，不调用 OpenAI 或客户 API，不消耗额度。

## 选择远程 API

只有明确选择远程提供方时才测试真实 API：

1. 打开页面左侧 `Provider`。
2. 选择 `OpenAI` 或 `Custom API`，不要停留在 `Auto` / `Mock`。
3. 点击 `API Settings`。
4. OpenAI：填写 Base URL、Image model、API Key，保存后点击 `Test API`。
5. Custom API：切到 `Custom API`，填写 endpoint、method、model、auth header/scheme/API Key，保存后点击 `Test API`。

Key 只应放在本机 `.env` 或客户自己的测试环境里，不要截图、提交或发到聊天里。

## 验证流程

1. 导入：点击 `Import image` 导入图片，或点击 `Import model` 导入 OBJ/STL；也可以用示例素材开始。
2. 画笔：选择 `Brush` 在左侧画布涂抹遮罩；调整 brush size 后再画一次。
3. 形状和选择：用 rectangle/circle 创建区域，切到 Select 后移动或缩放区域。
4. 生成：输入 prompt，确认 Provider 是本地预览或已配置的远程 API，点击 `Generate`。
5. 下载：右侧出现输出后点击 `Download`，应下载 `instant-canvas-*.png`。

## 本轮不验收

- 3ds Max 插件安装和 DCC 捕获链路：冻结，后续轮次处理。
- Blender 插件或导出链路：冻结，后续轮次处理。
- ComfyUI 后端：本轮不开发，不作为客户可用能力承诺。
