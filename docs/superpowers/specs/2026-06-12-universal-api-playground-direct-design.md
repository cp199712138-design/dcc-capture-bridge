# Universal API Playground Direct Design

**Goal:** Build a lightweight web page that lets a customer test an API by entering their own URL, API key, headers, and request body, then viewing and exporting the response.

**Decision:** First version is browser-direct only. It does not use a proxy, does not save customer API keys, and does not add accounts, teams, collections, or history storage.

## Context

The project already has an Instant Canvas web surface under `capture-canvas/` and a local server in `serve-static.mjs`. This design adds a customer-facing generic API tester as a small, separate page, not as a replacement for the existing canvas workflow.

The page is meant to reduce support friction. Instead of asking customers to send screenshots from browser devtools or external API tools, they can run a request in the page and export a compact test record.

## User Flow

1. Customer opens the API playground page.
2. Customer enters an API URL.
3. Customer selects the HTTP method.
4. Customer enters an API key or bearer token if needed.
5. Customer edits headers and JSON body.
6. Customer clicks `Send`.
7. Page sends the request from the browser using `fetch`.
8. Page displays status, elapsed time, response headers, raw response text, formatted JSON when possible, and image preview when the response is image-like.
9. Customer clicks `Export Record` to download a local JSON file containing the request shape and response details.

## Scope

In scope:

- URL input.
- Method selector for `GET`, `POST`, `PUT`, `PATCH`, and `DELETE`.
- API key input with helper modes: no auth, bearer token, or custom header.
- Editable headers as JSON.
- Editable request body as text with JSON formatting validation when possible.
- Send button with loading and disabled states.
- Response panel for status, timing, headers, raw body, and formatted JSON.
- Image preview for image responses and image data URLs.
- Export test record as a local `.json` download.
- Clear button that resets sensitive fields.
- CORS failure message that explains the target API must allow browser access.

Out of scope for version 1:

- Backend proxy.
- Account system.
- Stored API keys.
- Saved collections.
- Persistent request history.
- Team sharing.
- Automatic retries.
- Secret sync to `.env`.

## Security Rules

- The browser UI must never persist API keys to localStorage, sessionStorage, IndexedDB, cookies, or project files.
- API key fields clear on page refresh.
- Exported records must redact API keys and authorization headers by default.
- The page should warn before exporting if custom headers contain names such as `authorization`, `x-api-key`, `api-key`, `token`, or `secret`.
- `.env`, `.env.*`, `*token*`, `*secret*`, runtime output, captures, and `.superpowers/` remain ignored by Git.

## CORS Behavior

Because version 1 sends requests directly from the browser, some target APIs may fail if they do not allow the playground origin.

When this happens, the UI should show a plain message:

```text
The browser blocked this request. The target API must allow this page origin with CORS headers, or this endpoint must be tested from a server-side proxy.
```

This is a product boundary, not a bug in the playground.

## UI Layout

The page uses a two-panel workbench:

- Left panel: request builder.
- Right panel: response viewer.

Request builder sections:

- Endpoint row: method selector and URL input.
- Auth row: auth mode and key/token input.
- Headers editor.
- Body editor.
- Actions: `Send`, `Clear`, `Format JSON`.

Response viewer sections:

- Summary: status, elapsed time, response size.
- Tabs or stacked sections: formatted JSON, raw response, response headers, image preview.
- Actions: `Copy Response`, `Export Record`.

## Data Shape

Exported record:

```json
{
  "version": 1,
  "createdAt": "2026-06-12T00:00:00.000Z",
  "request": {
    "method": "POST",
    "url": "https://api.example.com/render",
    "headers": {
      "authorization": "[redacted]",
      "content-type": "application/json"
    },
    "body": "{\"prompt\":\"test\"}"
  },
  "response": {
    "ok": true,
    "status": 200,
    "statusText": "OK",
    "elapsedMs": 423,
    "headers": {
      "content-type": "application/json"
    },
    "bodyPreview": "{\"id\":\"example\"}",
    "bodyType": "json"
  },
  "client": {
    "mode": "browser-direct",
    "corsSensitive": true
  }
}
```

## Testing

Manual checks:

- Load the page from the local server.
- Send `GET https://httpbin.org/get` or another CORS-enabled test endpoint.
- Send a `POST` request with JSON body to a CORS-enabled endpoint.
- Confirm invalid header JSON is caught before send.
- Confirm invalid body JSON can still be sent as raw text when content type is not JSON.
- Confirm authorization values are redacted in exported records.
- Confirm `Clear` removes URL, key, headers, body, and response.
- Confirm a CORS-blocked request shows the CORS explanation.

Automated checks:

- Unit test redaction helper.
- Unit test header parsing.
- Unit test export record creation.
- Browser smoke test page load and direct request to a local mock endpoint.

## Implementation Fit

Location:

- `capture-canvas/api-playground.html` for the page.
- `capture-canvas/api-playground.mjs` for client logic.
- `capture-canvas/api-playground.css` only if existing styles cannot support the page cleanly.
- Add a simple local mock endpoint in `serve-static.mjs` only for automated smoke testing.

The page should remain independent from the realtime canvas editor. Shared helpers are acceptable only when they already exist and do not make the playground depend on canvas state.

## Navigation

The customer-facing local URL is:

```text
/capture-canvas/api-playground.html
```

Add a small navigation link from the existing `capture-canvas/index.html` page to the playground. Do not make the playground the default landing page.
