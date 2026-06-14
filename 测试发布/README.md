# 测试发布

负责 Instant Canvas 的验证、发布检查、GitHub 上传准备和客户测试交接。

## Smoke Commands

单项验证：

```powershell
node capture-canvas/check-page.mjs
node capture-canvas/simulate-flow.mjs
node capture-canvas/test-api-contract.mjs
node capture-canvas/browser-smoke.mjs
```

完整验证：

```powershell
node capture-canvas/check-page.mjs --all
```

## Secret Scan

不要用裸 `rg 'sk-' .` 作为失败条件，它会误报 `sk-...` 这类占位符。

推荐：

```powershell
rg 'sk-(?!\.\.\.)(?!test\b)(?:proj-)?[A-Za-z0-9_-]{20,}' . -g '!node_modules' -g '!.git' -g '!.env' -g '!.env.*'
```

允许出现：

- `sk-...`
- `test-key`
- `.env.example` 里的空值或说明文字

不允许提交：

- 真实 OpenAI key
- 客户自定义 API key
- 客户图片、模型、截图、渲染结果

## Customer-Test Release Notes

每次给客户测试时记录：

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

## 3ds Max Scripts

3ds Max 安装脚本仍保留，但不属于当前 Instant Canvas 网页发布主线：

- `install-3dsmax.ps1`: 安装 3ds Max 插件包到 `C:\ProgramData\Autodesk\ApplicationPlugins`
- `uninstall-3dsmax.ps1`: 移除已安装的 3ds Max 插件包
