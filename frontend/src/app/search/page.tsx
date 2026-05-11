import { Metadata } from "next";
import { SearchClient } from "@/components/search/SearchClient";

export const metadata: Metadata = {
  title: "Хайлт",
  description: "Monpang онлайн дэлгүүрээс бүтээгдэхүүн хайх",
  robots: {
    index: false,
    follow: true,
  },
};

export default function SearchPage() {
  return <SearchClient />;
}
