// Pure helpers for ProductMainCard.

// Format number with comma separators (e.g., 1000000 -> 1,000,000)
export function formatPrice(value: string | number): string {
  if (value === "" || value === null || value === undefined) return "";
  const numStr = String(value).replace(/[^0-9]/g, "");
  if (numStr === "") return "";
  return Number(numStr).toLocaleString("en-US");
}

// Parse formatted price back to raw number string (e.g., 1,000,000 -> 1000000)
export function parsePrice(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

export async function uploadFiles(files: File[]): Promise<string[]> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }

  const res = await fetch("/api/admin/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Upload failed");
  }

  const data = await res.json();
  return data.urls;
}
