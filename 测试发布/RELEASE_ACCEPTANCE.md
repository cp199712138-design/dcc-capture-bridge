# 发布前验收清单

本清单用于客户测试版发布前确认。所有命令都从项目根目录运行。

## 必跑检查

```powershell
node capture-canvas/check-page.mjs --all
```

该命令会按顺序运行：

- `node capture-canvas/check-page.mjs`
- `node capture-canvas/simulate-flow.mjs`
- `node capture-canvas/test-model-import.mjs`
- `node capture-canvas/test-api-contract.mjs`
- `node capture-canvas/browser-smoke.mjs`

如果 `browser-smoke` 因 Chrome/Edge、CDP、websocket 或 headless 环境失败或被脚本标记 `browser_smoke_skipped`，记录原始错误，并补一轮人工浏览器验收；不要修改 UI/API/Canvas 代码来绕过环境问题。

## 单项复查

需要定位问题时单独运行：

```powershell
node capture-canvas/test-api-contract.mjs
node capture-canvas/test-model-import.mjs
node capture-canvas/browser-smoke.mjs
```

## Secret scan

使用真实 key 模式，避免把 `sk-...`、`test-key` 这类占位符当成泄漏：

```powershell
rg --pcre2 'sk-(?!\.\.\.)(?!test\b)(?:proj-)?[A-Za-z0-9_-]{20,}' . -g '!node_modules' -g '!.git' -g '!.env' -g '!.env.*'
```

期望结果：无真实 OpenAI key、客户 API key、客户图片、模型、截图、渲染结果进入提交范围。

## GitHub draft PR

发布给客户测试前确认：

- 当前分支是客户测试分支。
- PR 保持 Draft，除非负责人明确要求 Ready for review。
- PR 描述包含：启动地址、mock 默认不耗额度、OpenAI/Custom/FLUX.2 选择方式、FLUX.2 手动生成说明、已跑验证命令、冻结范围。
- 没有提交 `.env`、客户素材、临时浏览器 profile、测试输出或大型二进制。

## 冻结范围说明

客户测试说明和 PR 描述必须明确：

- 3ds Max：本轮冻结，不验收插件安装和 DCC 捕获链路。
- Blender：本轮冻结，不验收插件或导出链路。
- ComfyUI：本轮不开发，不承诺可用后端。
