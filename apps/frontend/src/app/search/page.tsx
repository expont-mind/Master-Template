import { Metadata } from "next";

import { SearchClient } from "@/components/search/SearchClient";
import { BRAND } from "@/lib/utils/brand-config";

export const metadata: Metadata = {
  title: "Хайлт",
  description: `${BRAND.name} онлайн дэлгүүрээс бүтээгдэхүүн хайх`,
  robots: {
    index: false,
    follow: true,
  },
};

export default function SearchPage() {
  return <SearchClient />;
}
