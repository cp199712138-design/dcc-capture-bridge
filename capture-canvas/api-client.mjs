export const STATIC_API_CONFIG_KEY = "dcc-capture-static-api-config";

export function loadStaticApiConfig() {
  try {
    return JSON.parse(localStorage.getItem(STATIC_API_CONFIG_KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveStaticApiConfig(payload) {
  const current = loadStaticApiConfig();
  const providerKey = payload.provider === "openai" ? "openai" : "custom";
  const next = {
    ...current,
    static_demo: true,
    [providerKey]: {
      ...(current[providerKey] || {}),
      base_url: payload.baseUrl,
      model: payload.model,
      method: payload.method,
      auth_header: payload.authHeader,
      auth_scheme: payload.authScheme,
      key_saved: Boolean(payload.apiKey || current[providerKey]?.api_key),
      api_key: payload.apiKey || current[providerKey]?.api_key || "",
    },
  };
  localStorage.setItem(STATIC_API_CONFIG_KEY, JSON.stringify(next));
  return next;
}

export function staticApiConfigWithDefaults() {
  const stored = loadStaticApiConfig();
  return {
    static_demo: true,
    ...stored,
    openai: { base_url: "https://api.openai.com/v1", model: "gpt-image-1", ...(stored.openai || {}) },
    custom: { method: "POST", auth_header: "authorization", auth_scheme: "Bearer", ...(stored.custom || {}) },
  };
}

export async function fetchApiConfig() {
  const response = await fetch("/api/config", { cache: "no-store" });
  return response.json();
}

export async function postApiConfig(payload) {
  const response = await fetch("/api/config", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!data.ok) throw new Error(data.message || "Save failed");
  return data;
}

export async function postProviderTest(payload) {
  const response = await fetch("/api/test-provider", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return response.json();
}

export function directCustomConfig(apiConfig, payload = {}) {
  const stored = loadStaticApiConfig();
  const saved = stored.custom || apiConfig?.custom || {};
  return {
    provider: "custom-http",
    baseUrl: payload.baseUrl || saved.base_url || "",
    model: payload.model || saved.model || "",
    apiKey: payload.apiKey || saved.api_key || "",
    method: payload.method || saved.method || "POST",
    authHeader: payload.authHeader || saved.auth_header || "authorization",
    authScheme: payload.authScheme || saved.auth_scheme || "Bearer",
  };
}

export async function callDirectCustomApi(requestBody, payload = {}, apiConfig = {}, missingUrlMessage = "Set the Custom API URL first.") {
  const config = directCustomConfig(apiConfig, payload);
  if (!config.baseUrl) throw new Error(missingUrlMessage);
  const headers = { "content-type": "application/json" };
  if (config.apiKey) headers[config.authHeader || "authorization"] = `${config.authScheme || "Bearer"} ${config.apiKey}`.trim();
  const response = await fetch(config.baseUrl, {
    method: config.method || "POST",
    headers,
    body: JSON.stringify({
      ...requestBody,
      model: config.model || requestBody.model || "",
      dcc_capture_bridge: {
        ...(requestBody.dcc_capture_bridge || {}),
        static_demo_direct: true,
        contract: "custom-http-json-v1",
      },
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || `HTTP ${response.status}`);
  return data;
}

export async function postRealtimeRender(requestBody, signal) {
  const response = await fetch("/api/realtime-render", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(requestBody),
    signal,
  });
  return response.json();
}
