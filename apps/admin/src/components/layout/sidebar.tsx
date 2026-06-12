"use client";

import {
  Package01Icon,
  LeftToRightListBulletIcon,
  WarehouseIcon,
  BankIcon,
  PolicyIcon,
  NewsIcon,
  CarouselHorizontalIcon,
  LayerIcon,
  InformationCircleIcon,
  Cone01Icon,
  Analytics01Icon,
  FileAttachmentIcon,
  Coins01Icon,
  TicketStarIcon,
  ChatQuestionFreeIcons,
  Coupon01Icon,
  Message01Icon,
  PaymentIcon,
  WebValidationIcon,
  MapsLocation01Icon,
  Store03Icon,
  UserMultipleIcon,
  Tag02Icon,
  TruckDeliveryIcon,
  DashboardSquare02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/utils/brand-config";

import type { IconSvgElement } from "@hugeicons/react";

interface MenuItem {
  title: string;
  href: string;
  icon: IconSvgElement;
  disabled?: boolean;
  badge?: number;
}

interface MenuSection {
  label?: string;
  items: MenuItem[];
}

const mainSections: MenuSection[] = [
  {
    items: [
      {
        title: "Хянах самбар",
        href: "/dashboard",
        icon: DashboardSquare02Icon,
      },
      { title: "Бүтээгдэхүүн", href: "/products", icon: Package01Icon },
      {
        title: "Захиалгууд",
        href: "/orders",
        icon: TruckDeliveryIcon,
        badge: 0,
      },
      {
        title: "Категориуд",
        href: "/categories",
        icon: LeftToRightListBulletIcon,
      },
      { title: "Брэндүүд", href: "/brands", icon: Tag02Icon },
      { title: "Агуулах", href: "/warehouses", icon: WarehouseIcon },
      { title: "Үйлчлүүлэгчид", href: "/users", icon: UserMultipleIcon },
      { title: "Салбаруууд", href: "/branches", icon: Store03Icon },
      { title: "Аналитик", href: "/analytics", icon: Analytics01Icon },
    ],
  },
  {
    label: "Тохиргоо",
    items: [
      { title: "Дансны мэдээлэл", href: "/bank-accounts", icon: BankIcon },
      { title: "Хүргэлт", href: "/deliveries", icon: MapsLocation01Icon },
      {
        title: "Сошиал хаягууд",
        href: "/social-links",
        icon: WebValidationIcon,
      },
      { title: "Нөхцөлүүд", href: "/policies", icon: PolicyIcon },
      { title: "QPay холболт", href: "/payments", icon: PaymentIcon },
      { title: "Төлбөрийн лог", href: "/payment-logs", icon: FileAttachmentIcon },
    ],
  },
  {
    label: "Контент",
    items: [
      { title: "Нийтлэл", href: "/articles", icon: NewsIcon },
      { title: "Арга хэмжээ", href: "/events", icon: TicketStarIcon },
      { title: "Баннер", href: "/banners", icon: CarouselHorizontalIcon },
      {
        title: "Pop-up мэдэгдэл",
        href: "/notifications",
        icon: LayerIcon,
        disabled: true,
      },
      {
        title: "Бидний тухай",
        href: "/about",
        icon: InformationCircleIcon,
        disabled: true,
      },
      { title: "Нийтлэг асуулт", href: "/faqs", icon: ChatQuestionFreeIcons },
      { title: "Купон", href: "/coupons", icon: Coupon01Icon },
      { title: "Поинт", href: "/points", icon: Coins01Icon },
      { title: "SMS илгээх", href: "/sms-campaigns", icon: Message01Icon },
    ],
  },
];

function SidebarItem({ item, isActive }: { item: MenuItem; isActive: boolean }) {
  if (item.disabled) {
    return (
      <li>
        <span className="flex items-center gap-3 rounded-lg p-2 text-sm text-sidebar-foreground/35 cursor-not-allowed">
          <HugeiconsIcon icon={item.icon} size={18} className="shrink-0" strokeWidth={1.5} />
          <span className="truncate">{item.title}</span>
          <HugeiconsIcon icon={Cone01Icon} size={14} className="shrink-0 ml-auto" />
        </span>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors text-slate-950",
          isActive ? "bg-white font-semibold" : "hover:bg-white",
        )}
      >
        <HugeiconsIcon icon={item.icon} size={18} className="shrink-0" strokeWidth={1.5} />
        <span className="truncate">{item.title}</span>
        {item.badge != null && item.badge > 0 && (
          <span className="ml-auto bg-foreground text-white text-sm font-semibold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
            {item.badge}
          </span>
        )}
      </Link>
    </li>
  );
}

interface SidebarProps {
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}

export function Sidebar({ mobileOpen, onMobileOpenChange }: SidebarProps) {
  const pathname = usePathname();

  // Auto-close mobile sidebar on navigation
  useEffect(() => {
    onMobileOpenChange(false);
  }, [pathname, onMobileOpenChange]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex h-14 items-center p-2 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5 p-1.5">
          <Image
            src="/monpang-logo.svg"
            alt={BRAND.name}
            width={24}
            height={20}
            className="shrink-0"
          />
          <span className="text-base font-semibold tracking-tight">{BRAND.name}</span>
        </Link>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-hide p-">
        <div className="flex flex-col gap-2">
          {mainSections.map((section, i) => (
            <div key={section.label ?? `section-${i}`} className="p-2">
              {section.label && (
                <p className="px-2 text-xs text-slate-950 leading-8 font-medium tracking-wider opacity-70">
                  {section.label}
                </p>
              )}
              <ul className="flex flex-col gap-1">
                {section.items.map((item) => (
                  <SidebarItem key={item.href} item={item} isActive={isActive(item.href)} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>
    </>
  );

  return (
    <>
      {/* Desktop sidebar - hidden below lg */}
      <aside className="hidden lg:flex fixed left-0 top-0 z-40 h-screen w-full max-w-[255px] bg-slate-50 text-slate-950 flex-col p-2">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar - Sheet from left */}
      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent
          side="left"
          className="w-64 px-2 py-3 bg-slate-50 text-slate-950 [&>button]:hidden"
        >
          <SheetTitle className="sr-only">Цэс</SheetTitle>
          {sidebarContent}
        </SheetContent>
      </Sheet>
    </>
  );
}
