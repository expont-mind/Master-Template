export function generateSlug(text: string): string {
  // Remove Mongolian/Cyrillic characters, only allow a-z and 0-9
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // If slug is empty (e.g., all Mongolian text), generate a random one
  if (!slug) {
    const random = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    return `product-${random}`;
  }

  return slug;
}
