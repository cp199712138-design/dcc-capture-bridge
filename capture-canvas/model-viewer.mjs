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

function componentSize(componentType) {
  return {
    5120: 1,
    5121: 1,
    5122: 2,
    5123: 2,
    5125: 4,
    5126: 4,
  }[componentType] || 0;
}

function componentCount(type) {
  return {
    SCALAR: 1,
    VEC2: 2,
    VEC3: 3,
    VEC4: 4,
    MAT2: 4,
    MAT3: 9,
    MAT4: 16,
  }[type] || 0;
}

function readComponent(view, offset, componentType) {
  if (componentType === 5120) return view.getInt8(offset);
  if (componentType === 5121) return view.getUint8(offset);
  if (componentType === 5122) return view.getInt16(offset, true);
  if (componentType === 5123) return view.getUint16(offset, true);
  if (componentType === 5125) return view.getUint32(offset, true);
  if (componentType === 5126) return view.getFloat32(offset, true);
  return NaN;
}

function dataUriBytes(uri) {
  const match = String(uri || "").match(/^data:.*?;base64,(.+)$/);
  if (!match) return null;
  const binary = atob(match[1]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function readAccessor(gltf, buffers, accessorIndex) {
  const accessor = gltf.accessors?.[accessorIndex];
  const bufferView = gltf.bufferViews?.[accessor?.bufferView];
  const buffer = buffers[bufferView?.buffer || 0];
  const count = Number(accessor?.count || 0);
  const components = componentCount(accessor?.type);
  const size = componentSize(accessor?.componentType);
  if (!accessor || !bufferView || !buffer || !count || !components || !size) return [];

  const start = Number(bufferView.byteOffset || 0) + Number(accessor.byteOffset || 0);
  const stride = Number(bufferView.byteStride || components * size);
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const rows = [];
  for (let row = 0; row < count; row += 1) {
    const values = [];
    const rowOffset = start + row * stride;
    for (let component = 0; component < components; component += 1) {
      values.push(readComponent(view, rowOffset + component * size, accessor.componentType));
    }
    rows.push(components === 1 ? values[0] : values);
  }
  return rows;
}

function gltfTriangles(gltf, buffers) {
  const triangles = [];
  for (const mesh of gltf.meshes || []) {
    for (const primitive of mesh.primitives || []) {
      if (primitive.mode !== undefined && primitive.mode !== 4) continue;
      const positionAccessor = primitive.attributes?.POSITION;
      if (positionAccessor === undefined) continue;
      const positions = readAccessor(gltf, buffers, positionAccessor);
      const indices = primitive.indices === undefined ? positions.map((_, index) => index) : readAccessor(gltf, buffers, primitive.indices);
      for (let i = 0; i + 2 < indices.length; i += 3) {
        const a = positions[indices[i]];
        const b = positions[indices[i + 1]];
        const c = positions[indices[i + 2]];
        if (a && b && c) triangles.push([...a, ...b, ...c]);
      }
    }
  }
  return triangles;
}

async function parseGltf(text) {
  const gltf = JSON.parse(text);
  const buffers = [];
  for (const buffer of gltf.buffers || []) {
    const bytes = dataUriBytes(buffer.uri);
    if (!bytes) throw new Error("glTF files must embed buffers as data URIs. Use GLB for external buffers.");
    buffers.push(bytes);
  }
  return gltfTriangles(gltf, buffers);
}

function parseGlb(buffer) {
  if (buffer.byteLength < 20) return [];
  const view = new DataView(buffer);
  if (view.getUint32(0, true) !== 0x46546c67 || view.getUint32(4, true) !== 2) return [];
  const totalLength = Math.min(view.getUint32(8, true), buffer.byteLength);
  let offset = 12;
  let gltf = null;
  let bin = null;
  while (offset + 8 <= totalLength) {
    const chunkLength = view.getUint32(offset, true);
    const chunkType = view.getUint32(offset + 4, true);
    const chunkOffset = offset + 8;
    const chunk = new Uint8Array(buffer, chunkOffset, Math.min(chunkLength, totalLength - chunkOffset)).slice();
    if (chunkType === 0x4e4f534a) gltf = JSON.parse(new TextDecoder().decode(chunk).trim());
    if (chunkType === 0x004e4942) bin = chunk;
    offset = chunkOffset + chunkLength;
  }
  if (!gltf || !bin) return [];
  return gltfTriangles(gltf, [bin]);
}

function measureTriangles(triangles) {
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

  return {
    bounds,
    center: { x: cx, y: cy, z: cz },
    span,
    triangles: triangles.map((tri) => tri.map((value, index) => {
      if (index % 3 === 0) return (value - cx) / span;
      if (index % 3 === 1) return (value - cy) / span;
      return (value - cz) / span;
    })),
  };
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
  } else if (ext === "glb") {
    triangles = parseGlb(await file.arrayBuffer());
  } else if (ext === "gltf") {
    triangles = await parseGltf(await file.text());
  } else {
    throw new Error("Only OBJ, STL, GLB, and embedded glTF model imports are supported.");
  }

  const measured = measureTriangles(triangles.filter((tri) => tri.length === 9 && tri.every(Number.isFinite)));
  triangles = measured.triangles;
  if (!triangles.length) throw new Error("No renderable triangles found in this model.");

  return {
    name: file.name,
    format: ext,
    triangles,
    triangleCount: triangles.length,
    bounds: measured.bounds,
    center: measured.center,
    span: measured.span,
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
      if (!geometry || !shouldHandlePointer(event)) return;
      zoom = Math.max(0.45, Math.min(2.2, zoom - event.deltaY * 0.001));
      onChange();
      event.preventDefault();
    }, { passive: false });
  }

  return { attach, clear, renderTo, setGeometry, snapshot };
}
