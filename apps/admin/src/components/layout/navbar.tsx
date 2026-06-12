"use client";

import { Bell, LogOut, Settings, Menu } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useState, useRef, useMemo, useEffect } from "react";

import { NotificationPanel } from "@/components/notification";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUnreadAdminNotificationCount } from "@/hooks/useRealtimeAdminNotifications";
import { createClient } from "@/lib/supabase/client";

interface NavbarProps {
  user: {
    email: string;
    name?: string;
  } | null;
  onMenuClick: () => void;
}

const pageTitles: Record<string, string> = {
  "/dashboard": "Хянах самбар",
  "/products": "Бүтээгдэхүүн",
  "/orders": "Захиалгууд",
  "/categories": "Категориуд",
  "/brands": "Брэндүүд",
  "/warehouses": "Агуулах",
  "/users": "Үйлчлүүлэгчид",
  "/branches": "Салбаруууд",
  "/analytics": "Аналитик",
  "/bank-accounts": "Дансны мэдээлэл",
  "/store-settings": "Дэлгүүр",
  "/deliveries": "Хүргэлт",
  "/social-links": "Сошиал хаягууд",
  "/policies": "Нөхцөлүүд",
  "/payments": "QPay холболт",
  "/payment-logs": "Төлбөрийн лог",
  "/articles": "Нийтлэл",
  "/banners": "Баннер",
  "/ads": "Урсдаг зар",
  "/notifications": "Pop-up мэдэгдэл",
  "/about": "Бидний тухай",
  "/faqs": "Нийтлэг асуулт",
  "/events": "Арга хэмжээ",
  "/mass-messages": "Масс мессеж",
  "/coupons": "Купон",
  "/campaigns": "Хямдралын аян",
  "/points": "Поинт",
};

function resolvePageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  const base = "/" + pathname.split("/")[1];
  return pageTitles[base] ?? "Админ Панел";
}

function getInitials(user: NavbarProps["user"]): string {
  if (user?.name) {
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  }
  return user?.email?.[0]?.toUpperCase() ?? "A";
}

function formatUbTime(): string {
  return new Date().toLocaleString("mn-MN", {
    timeZone: "Asia/Ulaanbaatar",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function NotificationBadge({ unreadCount }: { unreadCount?: number }) {
  if (!unreadCount || unreadCount <= 0) return null;
  return (
    <Badge
      variant="destructive"
      className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
    >
      {unreadCount > 99 ? "99+" : unreadCount}
    </Badge>
  );
}

export function Navbar({ user, onMenuClick }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { data: unreadCount } = useUnreadAdminNotificationCount();

  const pageTitle = useMemo(() => resolvePageTitle(pathname), [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  // Initialise empty to avoid SSR/client locale mismatch (hydration error)
  const [ubTime, setUbTime] = useState("");

  useEffect(() => {
    // Hydration-safe initial set; subsequent updates come from interval.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUbTime(formatUbTime());
    const id = setInterval(() => setUbTime(formatUbTime()), 60_000);
    return () => clearInterval(id);
  }, []);

  const initials = getInitials(user);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-1">
        <span className="hidden sm:block text-xs text-muted-foreground mr-2">{ubTime}</span>
        <div ref={notificationRef} className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
          >
            <Bell className="h-5 w-5" />
            <NotificationBadge unreadCount={unreadCount} />
          </Button>
          <NotificationPanel
            isOpen={isNotificationOpen}
            onClose={() => setIsNotificationOpen(false)}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name ?? "Админ"}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Тохиргоо</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Гарах</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
