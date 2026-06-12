# API Adapter

The browser never talks to a cloud API directly. It sends canvas data to the
local Node server, and the local server calls the configured provider.

## Local Endpoints

```text
GET  /api/status
POST /api/test-provider
POST /api/realtime-render
```

## Configure Providers

Copy `.env.example` to `.env`, then restart the server.

OpenAI:

```text
OPENAI_API_KEY=your_key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_IMAGE_MODEL=gpt-image-2
```

Custom customer API:

```text
DCC_CUSTOM_API_URL=https://your-api.example.com/render
DCC_CUSTOM_API_KEY=your_key
DCC_CUSTOM_API_MODEL=your-image-model
DCC_CUSTOM_API_AUTH_HEADER=authorization
DCC_CUSTOM_API_AUTH_SCHEME=Bearer
DCC_CUSTOM_API_METHOD=POST
DCC_CUSTOM_API_HEADERS={}
```

Do not commit `.env`.

## Custom API Request

The local server sends the same JSON shape for render requests and a smaller
`connection_test` variant for `POST /api/test-provider`:

```json
{
  "schema_version": "0.2.0",
  "session_id": "dcc_20260609123000",
  "task": "regional_scene_generation",
  "prompt": "Render the selected region as a clean product scene.",
  "strength": 0.62,
  "assets": [],
  "mask": {
    "type": "vector_strokes",
    "strokes": []
  },
  "output": {
    "target": "preview",
    "mode": "realtime_draft",
    "type": "image",
    "prompt_mode": "draw",
    "aspect_ratio": "1:1",
    "seed": 1284
  },
  "sourceImageDataUrl": "data:image/png;base64,...",
  "maskDataUrl": "data:image/png;base64,...",
  "reason": "preview",
  "dcc_capture_bridge": {
    "test": false,
    "contract": "custom-http-json-v1"
  }
}
```

## Custom API Response

Return one of these:

```json
{ "imageDataUrl": "data:image/png;base64,..." }
```

or:

```json
{ "b64_json": "..." }
```

Optional messages:

```json
{
  "imageDataUrl": "data:image/png;base64,...",
  "message": "ok",
  "message_en": "Rendered",
  "message_cn": "已生成"
}
```
