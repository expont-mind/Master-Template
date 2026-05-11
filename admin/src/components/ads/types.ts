import type { Tables, AdPosition } from "@/types/database";

export type Ad = Tables<"ads">;

export const AD_POSITIONS: { value: AdPosition; label: string }[] = [
  { value: "home", label: "Нүүр хуудас" },
  { value: "category", label: "Ангилал" },
  { value: "product", label: "Бүтээгдэхүүн" },
  { value: "search", label: "Хайлт" },
  { value: "checkout", label: "Төлбөр" },
];

export const AD_POSITION_LABELS: Record<AdPosition, string> = {
  home: "Нүүр хуудас",
  category: "Ангилал",
  product: "Бүтээгдэхүүн",
  search: "Хайлт",
  checkout: "Төлбөр",
};
