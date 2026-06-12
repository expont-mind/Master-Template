import { type SelectOption } from "@/components/checkout/SelectModal";

export interface CartItem {
  id: string;
  name: string;
  originalPrice: number;
  salePrice: number;
  quantity: number;
  image?: string;
  variantName?: string | null;
  sku?: string | null;
}

export const CITY_OPTIONS: SelectOption[] = [
  { value: "Улаанбаатар", label: "Улаанбаатар" },
  { value: "Архангай", label: "Архангай" },
  { value: "Баян-Өлгий", label: "Баян-Өлгий" },
  { value: "Баянхонгор", label: "Баянхонгор" },
  { value: "Булган", label: "Булган" },
  { value: "Говь-Алтай", label: "Говь-Алтай" },
  { value: "Говьсүмбэр", label: "Говьсүмбэр" },
  { value: "Дархан-Уул", label: "Дархан-Уул" },
  { value: "Дорноговь", label: "Дорноговь" },
  { value: "Дорнод", label: "Дорнод" },
  { value: "Дундговь", label: "Дундговь" },
  { value: "Завхан", label: "Завхан" },
  { value: "Орхон", label: "Орхон" },
  { value: "Өвөрхангай", label: "Өвөрхангай" },
  { value: "Өмнөговь", label: "Өмнөговь" },
  { value: "Сүхбаатар", label: "Сүхбаатар" },
  { value: "Сэлэнгэ", label: "Сэлэнгэ" },
  { value: "Төв", label: "Төв" },
  { value: "Увс", label: "Увс" },
  { value: "Ховд", label: "Ховд" },
  { value: "Хөвсгөл", label: "Хөвсгөл" },
  { value: "Хэнтий", label: "Хэнтий" },
];

export const DISTRICT_OPTIONS: SelectOption[] = [
  { value: "Баянгол", label: "Баянгол" },
  { value: "Баянзүрх", label: "Баянзүрх" },
  { value: "Чингэлтэй", label: "Чингэлтэй" },
  { value: "Хан-Уул", label: "Хан-Уул" },
  { value: "Сүхбаатар", label: "Сүхбаатар" },
  { value: "Сонгинохайрхан", label: "Сонгинохайрхан" },
  { value: "Налайх", label: "Налайх" },
  { value: "Багахангай", label: "Багахангай" },
  { value: "Багануур", label: "Багануур" },
];

export const KHOROO_OPTIONS: SelectOption[] = Array.from({ length: 30 }, (_, i) => ({
  value: `${i + 1}-р хороо`,
  label: `${i + 1}-р хороо`,
}));

export function formatPrice(price: number) {
  return price.toLocaleString("en-US").replace(/,/g, ",");
}

export type ModalField = "city" | "district" | "khoroo" | null;
