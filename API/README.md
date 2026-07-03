# API

负责 Instant Canvas 的本地服务、provider 选择、请求协议和密钥边界。

## Provider Behavior

- `mock-local`: zero-cost 本地预览，不做真实 API 调用。它只生成稳定、柔和的占位预览，方便演示请求链路；不是 AI 生成结果。
- `openai`: 需要 `OPENAI_API_KEY`；缺失时返回 `openai-missing`，不能伪装成功。
- `custom-http`: 需要 `DCC_CUSTOM_API_URL` 和 `DCC_CUSTOM_API_KEY`；缺失时返回 `custom-http-missing`，不能伪装成功。
- `POST /api/config` 保存 OpenAI 或 Custom API 配置后，会立即更新当前 Node 进程的运行时配置；页面生成不需要等到重启才使用新的 base URL、model、key、method/header。
- `POST /api/test-provider` 只返回连接状态、provider、host/model 和错误摘要，不返回 API key。
- OpenAI-compatible 的 `POST /api/test-provider` 会请求 `/models/{model}` 并要求返回 JSON model metadata。2xx HTML 或非 OpenAI-compatible JSON 会返回 `ok:false`，错误信息会明确指出 HTML/JSON/compatible 问题并附简短摘要。

## Contract Fields

Custom API render/test payload 保留这些证据字段：

- `schema_version`
- `session_id`
- `task`
- `prompt`
- `strength`
- `assets`
- `mask`
- `output`
- `sourceImageDataUrl`
- `maskDataUrl`
- `reason`
- `dcc_capture_bridge.contract`

## Static Demo Safety

静态 demo 没有本地 Node proxy。它只能作为客户测试模式：Custom API key 会留在客户自己的浏览器 localStorage，不能当成生产级密钥保护。OpenAI-compatible key 应走本地或托管 server proxy。
