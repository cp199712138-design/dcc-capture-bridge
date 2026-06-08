export const SCHEMA_VERSION = "0.2.0";

export function createSessionState(now = new Date()) {
  return {
    schema_version: SCHEMA_VERSION,
    session_id: `dcc_${now.toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}`,
    created_at: now.toISOString(),
    assets: [],
  };
}

export function registerAsset(state, asset) {
  const normalized = {
    id: asset.id || `${asset.kind}_${state.assets.length + 1}`,
    kind: asset.kind,
    name: asset.name || "untitled",
    size: Number(asset.size || 0),
    mime: asset.mime || "",
    width: Number(asset.width || 0),
    height: Number(asset.height || 0),
    source: asset.source || "browser",
  };

  return {
    ...state,
    assets: [...state.assets.filter((item) => item.id !== normalized.id), normalized],
  };
}

export function normalizeStroke(stroke) {
  const normalized = {
    kind: stroke.kind || "path",
    mode: stroke.mode === "erase" ? "erase" : "brush",
    size: clamp(Number(stroke.size || 24), 1, 256),
    points: (stroke.points || []).map((point) => ({
      x: Math.round(Number(point.x || 0) * 100) / 100,
      y: Math.round(Number(point.y || 0) * 100) / 100,
    })),
  };

  if (stroke.start) {
    normalized.start = {
      x: Math.round(Number(stroke.start.x || 0) * 100) / 100,
      y: Math.round(Number(stroke.start.y || 0) * 100) / 100,
    };
  }

  if (stroke.end) {
    normalized.end = {
      x: Math.round(Number(stroke.end.x || 0) * 100) / 100,
      y: Math.round(Number(stroke.end.y || 0) * 100) / 100,
    };
  }

  return normalized;
}

export function appendStroke(state, stroke) {
  return {
    ...state,
    mask: {
      ...(state.mask || {}),
      strokes: [...((state.mask && state.mask.strokes) || []), normalizeStroke(stroke)],
    },
  };
}

export function buildGenerationRequest({ state, prompt, strokes, strength, provider, seed, outputType, mode, aspectRatio }) {
  return {
    schema_version: SCHEMA_VERSION,
    session_id: state.session_id,
    provider: provider || "mock-local",
    task: "regional_scene_generation",
    prompt: String(prompt || "").trim(),
    strength: clamp(Number(strength || 0) / 100, 0, 1),
    assets: state.assets,
    mask: {
      type: "vector_strokes",
      strokes: (strokes || []).map(normalizeStroke),
    },
    output: {
      target: "preview",
      mode: "realtime_draft",
      type: outputType || "image",
      prompt_mode: mode || "draw",
      aspect_ratio: aspectRatio || "1:1",
      seed: Number(seed || 0),
    },
  };
}

export function chooseProvider(mode, options = {}) {
  if (mode === "comfyui") {
    return {
      id: "comfyui-local",
      label: "ComfyUI Local",
      transport: "http-websocket",
      endpoint: options.endpoint || "http://127.0.0.1:8188",
    };
  }

  if (mode === "api") {
    return {
      id: "cloud-api",
      label: "Cloud API",
      transport: "https",
      endpoint: options.endpoint || "",
    };
  }

  return {
    id: "mock-local",
    label: "Local Mock",
    transport: "none",
    endpoint: "",
  };
}

function clamp(value, min, max) {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}
