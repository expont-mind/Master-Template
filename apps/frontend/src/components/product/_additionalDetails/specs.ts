interface ProductDetail {
  id: string;
  type: string;
  content: string;
  sort_order: number;
}

export interface Spec {
  label: string;
  value: string;
}

/**
 * Build the specs table rows displayed in both the mobile and desktop
 * "Дэлгэрэнгүй тайлбар" sections — product name as the first row,
 * followed by each ProductDetail in sort order.
 */
export function buildSpecs(
  productName: string | undefined,
  details: ProductDetail[] | undefined,
): Spec[] {
  const specs: Spec[] = [];
  if (productName) {
    specs.push({ label: "Нэр", value: productName });
  }
  if (details && details.length > 0) {
    for (const detail of details) {
      specs.push({ label: detail.type, value: detail.content });
    }
  }
  return specs;
}
