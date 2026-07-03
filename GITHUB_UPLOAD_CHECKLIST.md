# GitHub Upload Checklist

## Instant Canvas Customer-Test Pass

Before a customer-test upload, run:

```powershell
node capture-canvas/check-page.mjs --all
```

If a single command is not desired while debugging, the matching individual
commands are:

```powershell
node capture-canvas/check-page.mjs
node capture-canvas/simulate-flow.mjs
node capture-canvas/test-api-contract.mjs
node capture-canvas/browser-smoke.mjs
```

Use this real-key scan so placeholders are not treated as leaked secrets:

```powershell
rg --pcre2 'sk-(?!\.\.\.)(?!test\b)(?:proj-)?[A-Za-z0-9_-]{20,}' . -g '!node_modules' -g '!.git' -g '!.env' -g '!.env.*'
```

Allowed placeholders: `sk-...`, `test-key`, and empty values in `.env.example`.
Do not upload `.env`, customer files, captures, renders, model files, or large
temporary assets.

Customer-test release notes should include:

```text
Build:
Commit:
URL:
What is ready:
What is preview-only:
Provider/API setup required:
Known limits:
Verification run:
Customer test steps:
Rollback / previous build:
```

## 本轮上传范围

当前 PR 先上传 Instant Canvas 浏览器客户测试内容：

```text
README.md
capture-canvas/
UI/
Canvas/
API/
测试发布/
development/00-dispatch/
development/01-ui-shell/
development/02-canvas-editor/
development/03-realtime-api/
development/06-testing-release/
docs/API_ADAPTER.md
```

本轮冻结，不新增实现：

```text
3ds Max
Blender
```

不要上传：

```text
.env
customer files
generated images
temporary test output
ComfyUI directory
local captures/renders/models
```

## GitHub 仓库建议名

```text
perfect-hd-screenshot-pro
```

或者更长期一点：

```text
dcc-capture-bridge
```

如果你想先对外明确是截图工具，选第一个。
如果你想提前占住未来 AI 管线定位，选第二个。
