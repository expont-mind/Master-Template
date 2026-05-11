import imageCompression from "browser-image-compression";

export async function compressImage(file: File): Promise<File> {
  // Skip GIFs (preserve animation)
  if (file.type === "image/gif") return file;

  // Skip small WebP files
  if (file.type === "image/webp" && file.size < 1024 * 1024) return file;

  const compressed = await imageCompression(file, {
    maxSizeMB: 1,
    useWebWorker: true,
    fileType: "image/webp",
    initialQuality: 0.8,
  });

  return new File([compressed], file.name.replace(/\.[^/.]+$/, ".webp"), {
    type: "image/webp",
  });
}

export async function compressImages(files: File[]): Promise<File[]> {
  return Promise.all(files.map(compressImage));
}
