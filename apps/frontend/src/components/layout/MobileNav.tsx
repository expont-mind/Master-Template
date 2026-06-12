"use client";

import { X, ChevronRight, User, Heart, Package } from "lucide-react";
import Link from "next/link";

import { Drawer } from "@/components/ui/Drawer";
import { BRAND } from "@/lib/utils/brand-config";
import { ROUTES } from "@/lib/utils/constants";
import { useUIStore } from "@/stores/ui-store";

// Sample categories - replace with actual data fetching
const categories = [
  { name: "Электроник", slug: "electronics", icon: "📱" },
  { name: "Хувцас", slug: "clothing", icon: "👕" },
  { name: "Гэр ахуй", slug: "home", icon: "🏠" },
  { name: "Спорт", slug: "sports", icon: "⚽" },
  { name: "Гоо сайхан", slug: "beauty", icon: "💄" },
  { name: "Хүүхдийн", slug: "kids", icon: "🧸" },
  { name: "Хоол хүнс", slug: "food", icon: "🍎" },
  { name: "Ном бичиг", slug: "books", icon: "📚" },
];

const userMenuItems = [
  { icon: User, label: "Миний бүртгэл", href: ROUTES.ACCOUNT },
  { icon: Package, label: "Захиалгууд", href: ROUTES.ORDERS },
  { icon: Heart, label: "Хадгалсан", href: ROUTES.WISHLIST },
];

export function MobileNav() {
  const { isMobileNavOpen, closeMobileNav } = useUIStore();

  return (
    <Drawer
      isOpen={isMobileNavOpen}
      onClose={closeMobileNav}
      position="left"
      size="md"
      showCloseButton={false}
      className="flex flex-col"
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-4 dark:border-zinc-800">
          <Link
            href={ROUTES.HOME}
            onClick={closeMobileNav}
            className="flex items-center text-xl font-bold text-zinc-900 dark:text-white"
          >
            <span className="text-2xl mr-1">🛒</span>
            {BRAND.name}
          </Link>
          <button
            onClick={closeMobileNav}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Categories */}
        <div className="flex-1 overflow-y-auto py-4">
          <h3 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Ангиллууд
          </h3>
          <nav className="space-y-1">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`${ROUTES.CATEGORIES}/${category.slug}`}
                onClick={closeMobileNav}
                className="flex items-center justify-between px-4 py-3 text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <span className="flex items-center gap-3">
                  <span className="text-lg">{category.icon}</span>
                  <span className="font-medium">{category.name}</span>
                </span>
                <ChevronRight className="h-4 w-4 text-zinc-400" />
              </Link>
            ))}
          </nav>

          {/* Divider */}
          <hr className="my-4 border-zinc-100 dark:border-zinc-800" />

          {/* User menu */}
          <h3 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Миний
          </h3>
          <nav className="space-y-1">
            {userMenuItems.map(({ icon: Icon, label, href }) => (
              <Link
                key={href}
                href={href}
                onClick={closeMobileNav}
                className="flex items-center gap-3 px-4 py-3 text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <Icon className="h-5 w-5 text-zinc-500" />
                <span className="font-medium">{label}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-100 p-4 dark:border-zinc-800">
          <button
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-3 font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            onClick={closeMobileNav}
          >
            Нэвтрэх
          </button>
          <p className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
            📞 7700-1234 | Даваа-Баасан: 09:00 - 18:00
          </p>
        </div>
      </div>
    </Drawer>
  );
}
