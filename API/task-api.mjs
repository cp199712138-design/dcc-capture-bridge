import { deflateSync } from "node:zlib";

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
let crcTable;

export function normalizeImageDataUrl(data = {}) {
  const value = firstString(
    data.imageDataUrl,
    data.image_data_url,
    data.output_image,
    data.image_url,
    data.url,
    data.data?.[0]?.imageDataUrl,
    data.data?.[0]?.image_data_url
  );
  if (value?.startsWith("data:image/")) return value;

  const b64 = firstString(
    data.b64_json,
    data.image_base64,
    data.imageBase64,
    data.data?.[0]?.b64_json,
    data.data?.[0]?.image_base64,
    data.data?.[0]?.imageBase64
  );
  if (!b64) return "";
  return b64.startsWith("data:image/") ? b64 : `data:image/png;base64,${b64}`;
}

export function createMockImageDataUrl(body = {}) {
  const sourceHash = hashString(body.sourceImageDataUrl || "");
  const maskHash = hashString(body.maskDataUrl || "");
  const promptHash = hashString(`${body.prompt || ""}|${body.task || ""}`);
  const width = 256;
  const height = 256;
  const rows = Buffer.alloc((width * 4 + 1) * height);
  const baseA = softColor(sourceHash, promptHash);
  const baseB = softColor(maskHash, sourceHash);
  const accent = softColor(promptHash, maskHash);
  const wash = softColor(sourceHash ^ maskHash ^ promptHash, promptHash);
  const sourceCenter = [
    0.18 + ((sourceHash & 255) / 255) * 0.64,
    0.18 + (((sourceHash >>> 8) & 255) / 255) * 0.64
  ];
  const maskCenter = [
    0.18 + ((maskHash & 255) / 255) * 0.64,
    0.18 + (((maskHash >>> 8) & 255) / 255) * 0.64
  ];
  const promptCenter = [
    0.18 + ((promptHash & 255) / 255) * 0.64,
    0.18 + (((promptHash >>> 8) & 255) / 255) * 0.64
  ];

  for (let y = 0; y < height; y++) {
    const row = y * (width * 4 + 1);
    const ny = y / (height - 1);
    rows[row] = 0;
    for (let x = 0; x < width; x++) {
      const offset = row + 1 + x * 4;
      const nx = x / (width - 1);
      const diagonal = (nx + ny) * 0.5;
      const sourceGlow = softSpot(nx, ny, sourceCenter[0], sourceCenter[1], 0.28);
      const maskGlow = softSpot(nx, ny, maskCenter[0], maskCenter[1], 0.34);
      const promptGlow = softSpot(nx, ny, promptCenter[0], promptCenter[1], 0.22);
      const band = Math.max(0, 1 - Math.abs(ny - (0.22 + ((promptHash >>> 16) & 255) / 455)) * 5);
      const panel = Math.max(0, 1 - Math.abs(nx - (0.28 + ((maskHash >>> 16) & 255) / 580)) * 6);
      let color = mixColor(baseA, baseB, diagonal);
      color = mixColor(color, wash, sourceGlow * 0.42);
      color = mixColor(color, accent, promptGlow * 0.55);
      color = mixColor(color, [246, 246, 238], band * 0.16);
      color = mixColor(color, [230, 236, 244], panel * maskGlow * 0.26);
      color = mixColor(color, [255, 255, 255], softSpot(nx, ny, 0.28, 0.18, 0.3) * 0.18);
      rows[offset] = clampByte(color[0]);
      rows[offset + 1] = clampByte(color[1]);
      rows[offset + 2] = clampByte(color[2]);
      rows[offset + 3] = 255;
    }
  }

  return `data:image/png;base64,${Buffer.concat([
    PNG_SIGNATURE,
    pngChunk("IHDR", Buffer.concat([
      uint32(width),
      uint32(height),
      Buffer.from([8, 6, 0, 0, 0])
    ])),
    pngChunk("IDAT", deflateSync(rows)),
    pngChunk("IEND", Buffer.alloc(0))
  ]).toString("base64")}`;
}

function firstString(...values) {
  return values.find((value) => typeof value === "string" && value.trim()) || "";
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < String(value).length; index++) {
    hash ^= String(value).charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function softColor(hash, salt) {
  return [
    118 + (((hash >>> 0) & 255) * 0.34) + (((salt >>> 16) & 255) * 0.08),
    126 + (((hash >>> 8) & 255) * 0.3) + (((salt >>> 8) & 255) * 0.08),
    138 + (((hash >>> 16) & 255) * 0.28) + (((salt >>> 0) & 255) * 0.08)
  ];
}

function softSpot(x, y, centerX, centerY, radius) {
  const dx = x - centerX;
  const dy = y - centerY;
  return Math.max(0, 1 - (dx * dx + dy * dy) / (radius * radius));
}

function mixColor(a, b, amount) {
  const t = Math.max(0, Math.min(1, amount));
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t
  ];
}

function clampByte(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  return Buffer.concat([
    uint32(data.length),
    typeBytes,
    data,
    uint32(crc32(Buffer.concat([typeBytes, data])))
  ]);
}

function uint32(value) {
  const bytes = Buffer.alloc(4);
  bytes.writeUInt32BE(value >>> 0);
  return bytes;
}

function crc32(buffer) {
  if (!crcTable) {
    crcTable = Array.from({ length: 256 }, (_, index) => {
      let value = index;
      for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
      return value >>> 0;
    });
  }

  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
