// Image utilities for the box-label Excel export.
//
// ExcelJS natively supports PNG/JPEG. WebP and other formats are
// transcoded to PNG via a canvas before being embedded. We also
// pre-detect format from magic bytes (rather than trusting MIME) to
// avoid embedding the wrong extension.

function bytesMatch(bytes: Uint8Array, signature: (number | null)[]): boolean {
  for (let i = 0; i < signature.length; i++) {
    const expected = signature[i];
    if (expected !== null && bytes[i] !== expected) return false;
  }
  return true;
}

// PNG: 89 50 4E 47
const PNG_SIG = [0x89, 0x50, 0x4e, 0x47];
// JPEG: FF D8 FF
const JPEG_SIG = [0xff, 0xd8, 0xff];
// WebP: RIFF....WEBP (positions 0-3 and 8-11)
const WEBP_SIG = [0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x45, 0x42, 0x50];

// Detect actual image format from magic bytes
export function detectImageFormat(buffer: ArrayBuffer): "png" | "jpeg" | "webp" | "unknown" {
  const bytes = new Uint8Array(buffer.slice(0, 12));
  if (bytesMatch(bytes, PNG_SIG)) return "png";
  if (bytesMatch(bytes, JPEG_SIG)) return "jpeg";
  if (bytesMatch(bytes, WEBP_SIG)) return "webp";
  return "unknown";
}

async function loadImageBlob(blobUrl: string): Promise<HTMLImageElement | null> {
  const img = new Image();
  const loaded = await new Promise<boolean>((resolve) => {
    const timeout = setTimeout(() => resolve(false), 10000);
    img.onload = () => {
      clearTimeout(timeout);
      resolve(true);
    };
    img.onerror = () => {
      clearTimeout(timeout);
      resolve(false);
    };
    img.src = blobUrl;
  });
  if (!loaded || img.naturalWidth === 0) return null;
  return img;
}

function scaleDimensions(
  width: number,
  height: number,
  maxDim: number,
): { width: number; height: number } {
  if (width <= maxDim && height <= maxDim) return { width, height };
  const scale = maxDim / Math.max(width, height);
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

// Convert image buffer to PNG via Canvas (for WebP/AVIF that ExcelJS can't handle)
export async function convertToPng(
  buffer: ArrayBuffer,
  mimeType: string,
): Promise<ArrayBuffer | null> {
  const blob = new Blob([buffer], { type: mimeType });
  const blobUrl = URL.createObjectURL(blob);
  try {
    const img = await loadImageBlob(blobUrl);
    if (!img) return null;

    const { width: w, height: h } = scaleDimensions(img.naturalWidth, img.naturalHeight, 200);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, w, h);

    const pngBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png"),
    );
    if (!pngBlob) return null;
    return pngBlob.arrayBuffer();
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

export async function fetchImageBuffer(
  url: string,
): Promise<{ buffer: ArrayBuffer; extension: "png" | "jpeg" } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const format = detectImageFormat(buffer);

    // PNG/JPEG: use directly — ExcelJS supports these natively
    if (format === "jpeg") return { buffer, extension: "jpeg" };
    if (format === "png") return { buffer, extension: "png" };

    // WebP/unknown: convert to PNG via Canvas
    const contentType = res.headers.get("content-type") || "image/webp";
    const pngBuffer = await convertToPng(buffer, contentType);
    if (!pngBuffer) return null;
    return { buffer: pngBuffer, extension: "png" };
  } catch {
    return null;
  }
}
