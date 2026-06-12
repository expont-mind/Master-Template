import imageCompression from "browser-image-compression";

// Compresses a single image to WebP, ≤3MB, with quality 0.92.
//
// Rationale: this is the SINGLE compression pass — the frontend Next.js
// Image then re-encodes. We optimize once at high quality here so the
// downstream re-encode doesn't compound to visible artifacts on product
// photos, brand logos, and hero banners. WebP @ 0.92 is visually
// indistinguishable from the original for most photographic content
// while still being ~3-5x smaller than the source JPEG.
//
// Skips:
//   - GIFs (preserves animation; would lose frames otherwise)
//   - Already-compressed WebP files <3MB (no double-encode)
export async function compressImage(file: File): Promise<File> {
  if (file.type === "image/gif") return file;
  if (file.type === "image/webp" && file.size < 3 * 1024 * 1024) return file;

  const compressed = await imageCompression(file, {
    maxSizeMB: 3,
    useWebWorker: true,
    fileType: "image/webp",
    initialQuality: 0.92,
  });

  return new File([compressed], file.name.replace(/\.[^/.]+$/, ".webp"), {
    type: "image/webp",
  });
}

// Compress an array of images in parallel.
export async function compressImages(files: File[]): Promise<File[]> {
  return Promise.all(files.map(compressImage));
}
