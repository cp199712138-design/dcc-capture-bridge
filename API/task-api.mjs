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
  const width = 32;
  const height = 32;
  const rows = Buffer.alloc((width * 4 + 1) * height);

  for (let y = 0; y < height; y++) {
    const row = y * (width * 4 + 1);
    rows[row] = 0;
    for (let x = 0; x < width; x++) {
      const offset = row + 1 + x * 4;
      const sourceBand = (sourceHash >>> ((x % 4) * 8)) & 255;
      const maskBand = (maskHash >>> ((y % 4) * 8)) & 255;
      const checker = ((x + (sourceHash & 7)) ^ (y + (maskHash & 7))) & 1;
      rows[offset] = (sourceBand + x * 9 + y * 3) & 255;
      rows[offset + 1] = (maskBand + y * 7 + (checker ? 80 : 18)) & 255;
      rows[offset + 2] = (promptHash + x * 5 + y * 11 + (checker ? 30 : 120)) & 255;
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
