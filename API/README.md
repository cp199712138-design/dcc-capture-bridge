# API

负责 Instant Canvas 的本地服务、provider 选择、请求协议和密钥边界。

## Provider Behavior

- `mock-local`: 没有远端配置时的本地预览，不做真实 API 调用。
- `openai`: 需要 `OPENAI_API_KEY`；缺失时返回 `openai-missing`，不能伪装成功。
- `custom-http`: 需要 `DCC_CUSTOM_API_URL`；缺失时返回 `custom-http-missing`。
- `POST /api/test-provider` 只返回连接状态、provider、host/model 和错误摘要，不返回 API key。

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
