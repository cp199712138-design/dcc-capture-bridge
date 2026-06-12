# Competitor / Similar Project Scan

## 结论

网上已经有不少 Blender + ComfyUI / AI 材质 / 多角度纹理项目。说明这个方向是成立的，不是空想。

但 3ds Max 方向明显少很多。我们的机会不是复制 Blender 项目，而是先做：

```text
3ds Max / Blender 通用的截图与控制图出口
```

再慢慢接 ComfyUI。

## 代表项目

### StableGen

GitHub:

```text
https://github.com/sakalond/StableGen
```

定位：

```text
Blender add-on + ComfyUI backend + 3D generation + texturing
```

已做到：

- 从图片/文本生成 3D。
- 给已有模型生成纹理。
- 支持 SDXL、FLUX、Qwen Image Edit。
- 多视角纹理一致性。
- 自动放置多个相机。
- ControlNet Depth / Canny / Normal。
- IPAdapter 风格控制。
- PBR 分解。
- 输出目录结构清楚。

值得借鉴：

- 多角度 camera strategy。
- control maps 目录管理。
- preset system。
- health / troubleshooting 思路。
- 输出目录按场景和时间组织。

不直接照搬：

- 功能太大，第一版不能学它一口吃成胖子。
- Blender 专属逻辑很多。
- 许可证和第三方模型/库需要注意，尤其部分 3D/PBR 链路可能有非商用限制。

### ComfyUI-BlenderAI-node

GitHub:

```text
https://github.com/AIGODLIKE/ComfyUI-BlenderAI-node
```

定位：

```text
把 ComfyUI 节点搬进 Blender 节点编辑器
```

已做到：

- Blender 内使用 ComfyUI node tree。
- Camera input。
- 视口实时输入。
- depth / mask / compositing data。
- AI 材质和纹理烘焙。
- 批量队列。
- ComfyUI 启动/连接配置。

它自己 README 里提到的痛点：

- ComfyUI 和第三方节点安装不正确，是大量失败原因。
- 交互步骤繁琐。
- 手册不够详细。
- 不够开箱即用。

值得借鉴：

- Camera input 和 viewport input。
- 不同节点可用性要测试。
- 必须做启动/连接状态。
- 必须有详细错误提示。

不直接照搬：

- 把 ComfyUI 节点完整搬进 DCC 会很重。
- 对非技术用户容易复杂。
- 我们更适合做 workflow preset 控制台，而不是重做节点编辑器。

### Texture Diffusion

GitHub:

```text
https://github.com/Shaamallow/texture-diffusion
```

定位：

```text
Blender add-on，用 diffusion/ComfyUI 给模型生成纹理
```

已做到：

- 当前视角生成纹理。
- img2img/inpainting。
- Depth ControlNet。
- IPAdapter / LoRA。
- UV projection。
- edit masking。
- multi texture shading。

值得借鉴：

- 从当前视角出图是第一步。
- depth pass 是很重要的控制图。
- 后处理和手动遮罩很重要。
- 多视角和多对象是后续路线，不是第一版。

### Texturaizer

官网:

```text
https://texturaizer.com/
```

定位：

```text
Blender add-on，通过 ComfyUI API 做本地 AI 图像生成和设计可视化
```

值得借鉴：

- 强调本地 ComfyUI API。
- 强调简化接口，而不是暴露所有节点。
- 产品化表达比纯 GitHub 项目更清楚。

## 市场/方向判断

已经存在的重点集中在：

```text
Blender + texture generation
Blender + ComfyUI node editor
Blender + multi-view projection
```

相对少的方向：

```text
3ds Max + ComfyUI
3ds Max + AI control image export
DCC-agnostic capture bridge
轻量截图到 AI workflow
```

所以我们的差异化可以是：

```text
先从 3ds Max 的稳定截图/控制图出口切入
底层接口设计成可迁移 Blender
ComfyUI 只作为后端 workflow，不重做节点编辑器
```

## 对我们项目的补充建议

### 1. 不要叫截图插件

内部定位改成：

```text
DCC Capture Bridge
```

对外第一版可以叫：

```text
Perfect HD Screenshot Pro
```

但架构上要承认它未来是 bridge。

### 2. 先做健康检测

未来接 ComfyUI 前必须先做：

- server ping
- `/system_stats`
- `/object_info`
- workflow validation
- upload test
- output folder test

### 3. Workflow 模板必须版本化

不要硬编码 node id。

结构：

```text
workflows/
  img2img-basic/
    workflow_api.json
    mapping.json
    README.md
```

### 4. 输出资产要分层

以后不要只存一张图：

```text
outputs/
  scene-name/
    2026-06-06_153000/
      beauty/
      depth/
      normal/
      mask/
      ai/
      metadata.json
```

### 5. UI 不要重做 ComfyUI

我们的 UI 只做：

- Capture
- Workflow preset
- Key params
- Generate
- Review output

节点编辑仍然交给 ComfyUI。

### 6. 学 Blender 是对的

Blender 版未来会更自然，因为：

- Python add-on 生态成熟。
- `bpy` 适合做面板、operator、render pass。
- 现有相似项目很多，可以学习架构。

但第一步还是 3ds Max MVP，因为这是我们的切入口。

## 参考链接

- StableGen: https://github.com/sakalond/StableGen
- ComfyUI-BlenderAI-node: https://github.com/AIGODLIKE/ComfyUI-BlenderAI-node
- Texture Diffusion: https://github.com/Shaamallow/texture-diffusion
- Texturaizer: https://texturaizer.com/
- ComfyUI API docs: https://docs.comfy.org/development/comfyui-server/comms_routes
