function extName(file) {
  return (file.name || "").split(".").pop().toLowerCase();
}

function parseObj(text) {
  const vertices = [];
  const triangles = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const parts = line.split(/\s+/);
    if (parts[0] === "v" && parts.length >= 4) {
      vertices.push([Number(parts[1]), Number(parts[2]), Number(parts[3])]);
    }
    if (parts[0] === "f" && parts.length >= 4) {
      const face = parts.slice(1).map((token) => {
        const value = Number(token.split("/")[0]);
        return value < 0 ? vertices.length + value : value - 1;
      }).filter((index) => vertices[index]);
      for (let i = 1; i < face.length - 1; i += 1) {
        triangles.push([...vertices[face[0]], ...vertices[face[i]], ...vertices[face[i + 1]]]);
      }
    }
  }

  return triangles;
}

function parseAsciiStl(text) {
  const points = [...text.matchAll(/vertex\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)/gi)]
    .map((match) => [Number(match[1]), Number(match[2]), Number(match[3])]);
  const triangles = [];
  for (let i = 0; i + 2 < points.length; i += 3) {
    triangles.push([...points[i], ...points[i + 1], ...points[i + 2]]);
  }
  return triangles;
}

function parseBinaryStl(buffer) {
  if (buffer.byteLength < 84) return [];
  const view = new DataView(buffer);
  const triangleCount = view.getUint32(80, true);
  if (84 + triangleCount * 50 !== buffer.byteLength) return [];

  const triangles = [];
  let offset = 84;
  for (let i = 0; i < triangleCount; i += 1) {
    offset += 12;
    const tri = [];
    for (let point = 0; point < 3; point += 1) {
      tri.push(view.getFloat32(offset, true), view.getFloat32(offset + 4, true), view.getFloat32(offset + 8, true));
      offset += 12;
    }
    triangles.push(tri);
    offset += 2;
  }
  return triangles;
}

function normalizeTriangles(triangles) {
  const bounds = {
    minX: Infinity, minY: Infinity, minZ: Infinity,
    maxX: -Infinity, maxY: -Infinity, maxZ: -Infinity,
  };

  for (const tri of triangles) {
    for (let i = 0; i < 9; i += 3) {
      bounds.minX = Math.min(bounds.minX, tri[i]);
      bounds.minY = Math.min(bounds.minY, tri[i + 1]);
      bounds.minZ = Math.min(bounds.minZ, tri[i + 2]);
      bounds.maxX = Math.max(bounds.maxX, tri[i]);
      bounds.maxY = Math.max(bounds.maxY, tri[i + 1]);
      bounds.maxZ = Math.max(bounds.maxZ, tri[i + 2]);
    }
  }

  const cx = (bounds.minX + bounds.maxX) / 2;
  const cy = (bounds.minY + bounds.maxY) / 2;
  const cz = (bounds.minZ + bounds.maxZ) / 2;
  const span = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY, bounds.maxZ - bounds.minZ, 1);

  return triangles.map((tri) => tri.map((value, index) => {
    if (index % 3 === 0) return (value - cx) / span;
    if (index % 3 === 1) return (value - cy) / span;
    return (value - cz) / span;
  }));
}

export async function parseModelFile(file) {
  const ext = extName(file);
  let triangles = [];

  if (ext === "obj") {
    triangles = parseObj(await file.text());
  } else if (ext === "stl") {
    const buffer = await file.arrayBuffer();
    triangles = parseBinaryStl(buffer);
    if (!triangles.length) triangles = parseAsciiStl(new TextDecoder().decode(buffer));
  } else {
    throw new Error("Only OBJ and STL model imports are supported.");
  }

  triangles = normalizeTriangles(triangles.filter((tri) => tri.length === 9 && tri.every(Number.isFinite)));
  if (!triangles.length) throw new Error("No renderable triangles found in this model.");

  return {
    name: file.name,
    format: ext,
    triangles,
    triangleCount: triangles.length,
  };
}

function rotatePoint(point, yaw, pitch) {
  const [x, y, z] = point;
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const x1 = x * cy + z * sy;
  const z1 = z * cy - x * sy;
  const y1 = y * cp - z1 * sp;
  return [x1, y1, z1 * cp + y * sp];
}

function faceNormal(a, b, c) {
  const ux = b[0] - a[0];
  const uy = b[1] - a[1];
  const uz = b[2] - a[2];
  const vx = c[0] - a[0];
  const vy = c[1] - a[1];
  const vz = c[2] - a[2];
  const nx = uy * vz - uz * vy;
  const ny = uz * vx - ux * vz;
  const nz = ux * vy - uy * vx;
  const length = Math.hypot(nx, ny, nz) || 1;
  return [nx / length, ny / length, nz / length];
}

export function createModelViewer() {
  let geometry = null;
  let yaw = -0.55;
  let pitch = -0.3;
  let zoom = 1;
  let dragging = false;
  let lastPoint = null;
  let onChange = () => {};
  let shouldHandlePointer = () => true;

  function setGeometry(nextGeometry) {
    geometry = nextGeometry;
    yaw = -0.55;
    pitch = -0.3;
    zoom = 1;
  }

  function clear() {
    geometry = null;
  }

  function drawBackground(ctx, w, h) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#eef0ea");
    grad.addColorStop(1, "#d7dcd8");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(20,28,36,.14)";
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.72, Math.min(w, h) * 0.24 * zoom, Math.min(w, h) * 0.055, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function renderTo(ctx, w, h, label = "") {
    drawBackground(ctx, w, h);
    if (!geometry) return;

    const scale = Math.min(w, h) * 1.18 * zoom;
    const faces = geometry.triangles.map((tri) => {
      const points = [
        rotatePoint([tri[0], tri[1], tri[2]], yaw, pitch),
        rotatePoint([tri[3], tri[4], tri[5]], yaw, pitch),
        rotatePoint([tri[6], tri[7], tri[8]], yaw, pitch),
      ];
      const normal = faceNormal(points[0], points[1], points[2]);
      const light = Math.max(0, normal[0] * -0.25 + normal[1] * 0.45 + normal[2] * 0.86);
      return {
        points: points.map(([x, y]) => [w / 2 + x * scale, h / 2 - y * scale]),
        depth: (points[0][2] + points[1][2] + points[2][2]) / 3,
        shade: 42 + light * 118,
      };
    }).sort((a, b) => a.depth - b.depth);

    for (const face of faces) {
      ctx.beginPath();
      ctx.moveTo(face.points[0][0], face.points[0][1]);
      ctx.lineTo(face.points[1][0], face.points[1][1]);
      ctx.lineTo(face.points[2][0], face.points[2][1]);
      ctx.closePath();
      ctx.fillStyle = `rgb(${Math.round(face.shade * 0.82)}, ${Math.round(face.shade * 0.95)}, ${Math.round(face.shade * 1.12)})`;
      ctx.strokeStyle = "rgba(8,14,20,.18)";
      ctx.lineWidth = 0.8;
      ctx.fill();
      ctx.stroke();
    }

    if (label) {
      ctx.fillStyle = "rgba(8,12,16,.72)";
      ctx.font = "700 13px Segoe UI, Microsoft YaHei, sans-serif";
      ctx.fillText(label, 42, 62);
    }
  }

  function snapshot(width, height, label = "") {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));
    renderTo(canvas.getContext("2d"), canvas.width, canvas.height, label);
    return canvas;
  }

  function attach(canvas, options = {}) {
    onChange = options.onChange || onChange;
    shouldHandlePointer = options.shouldHandlePointer || shouldHandlePointer;

    canvas.addEventListener("pointerdown", (event) => {
      if (!geometry || !shouldHandlePointer(event)) return;
      dragging = true;
      lastPoint = { x: event.clientX, y: event.clientY };
      canvas.setPointerCapture?.(event.pointerId);
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);

    canvas.addEventListener("pointermove", (event) => {
      if (!dragging || !lastPoint) return;
      yaw += (event.clientX - lastPoint.x) * 0.01;
      pitch = Math.max(-1.2, Math.min(1.2, pitch + (event.clientY - lastPoint.y) * 0.01));
      lastPoint = { x: event.clientX, y: event.clientY };
      onChange();
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);

    const endDrag = (event) => {
      if (!dragging) return;
      dragging = false;
      lastPoint = null;
      if (event?.pointerId !== undefined) canvas.releasePointerCapture?.(event.pointerId);
      event?.stopImmediatePropagation();
    };
    canvas.addEventListener("pointerup", endDrag, true);
    canvas.addEventListener("pointercancel", endDrag, true);

    canvas.addEventListener("wheel", (event) => {
      if (!geometry) return;
      zoom = Math.max(0.45, Math.min(2.2, zoom - event.deltaY * 0.001));
      onChange();
      event.preventDefault();
    }, { passive: false });
  }

  return { attach, clear, renderTo, setGeometry, snapshot };
}
