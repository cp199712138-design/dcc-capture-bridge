# Blender

Blender 端插件实现规划。

当前阶段只定义与 3ds Max evidence packet 的能力对齐要求，不写新的
Blender add-on 代码。

## Parity Requirements

Blender adapter 后续必须能产出与 3ds Max adapter 等价的 evidence packet。

### Source

- 支持 viewport source：当前 3D Viewport、当前视角、视图矩阵或可复现描述。
- 支持 camera source：活动 camera、camera 名称、分辨率、焦距或视角说明。
- 明确记录 source type：`viewport` 或 `camera`。

### Selected Object Identity

- 记录选中对象名称。
- 记录对象类型，例如 mesh、curve、camera、light。
- 记录可稳定引用的路径或集合信息，避免只保存屏幕截图。
- 多选时记录 primary selection 和 full selection list。

### Material Notes

- 记录对象当前材质名称。
- 记录关键材质意图，例如 base color、roughness、metallic、texture presence。
- 只记录生成需要的摘要，不复制完整材质节点树。

### Mask Or Region Intent

- 支持 selected-object mask intent。
- 支持 viewport region 或 crop intent。
- 记录 mask 是用于局部重绘、对象保护、背景替换还是构图参考。
- 第一阶段只定义 intent，不要求立即生成真实 mask pass。

### Output Size And Aspect Ratio

- 记录请求输出宽高。
- 记录实际捕获宽高。
- 记录 aspect ratio source：viewport、camera resolution 或 custom size。
- 当 custom size 与 source 比例不一致时，必须记录 fit strategy：crop、fit 或 stretch。

### Handoff Strategy

- 本地交换优先使用 capture session folder。
- session folder 至少包含 capture asset 和 metadata。
- URL handoff 后续可用于打开 Instant Canvas，但不能替代本地文件证据。
- Blender 与 3ds Max 应复用同一 metadata schema。

## Blocked Until

- 3ds Max evidence packet 稳定。
- 调度线程明确授权开始写 Blender add-on 代码。
