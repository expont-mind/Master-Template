import type { Tables } from "@/types/database";

export type BankAccount = Tables<"bank_accounts">;

export interface BankAccountFormData {
  bank_name: string;
  account_name: string;
  account_number: string;
  currency: string;
  is_default: boolean;
  is_active: boolean;
  logo_url: string | null;
  sort_order: number;
}

export const BANKS = [
  { value: "Хаан банк", label: "Хаан банк", logo: "/images/banks/Khan.png" },
  {
    value: "Голомт банк",
    label: "Голомт банк",
    logo: "/images/banks/Golomt.webp",
  },
  {
    value: "Худалдаа хөгжлийн банк",
    label: "Худалдаа хөгжлийн банк",
    logo: "/images/banks/TDB.png",
  },
  { value: "Хас банк", label: "Хас банк", logo: "/images/banks/Khas.png" },
  {
    value: "Төрийн банк",
    label: "Төрийн банк",
    logo: "/images/banks/State.png",
  },
  {
    value: "Капитрон банк",
    label: "Капитрон банк",
    logo: "/images/banks/Capitron.png",
  },
  { value: "Богд банк", label: "Богд банк", logo: "/images/banks/Bogd.jpg" },
  {
    value: "Чингис хаан банк",
    label: "Чингис хаан банк",
    logo: "/images/banks/Genghis.jpeg",
  },
  { value: "Ариг банк", label: "Ариг банк", logo: "/images/banks/Arig.png" },
  { value: "М банк", label: "М банк", logo: "/images/banks/M.jpg" },
];

export const CURRENCIES = [
  { value: "MNT", label: "Төгрөг (MNT)" },
  { value: "USD", label: "Доллар (USD)" },
  { value: "EUR", label: "Евро (EUR)" },
  { value: "CNY", label: "Юань (CNY)" },
];
