import { Card, CardContent } from "@/components/ui/card";
import {
  Package,
  ShoppingCart,
  Users,
  CreditCard,
} from "lucide-react";
import type { DashboardStats } from "./types";

interface KpiStatCardsProps {
  stats: DashboardStats;
}

export function KpiStatCards({ stats }: KpiStatCardsProps) {
  const cards = [
    {
      title: "Нийт бүтээгдэхүүн",
      value: stats.totalProducts.toLocaleString(),
      description: "Идэвхтэй бүтээгдэхүүн",
      icon: Package,
      iconBg: "bg-blue-100 text-blue-700",
    },
    {
      title: stats.isFiltered ? "Захиалга" : "Нийт захиалга",
      value: stats.totalOrders.toLocaleString(),
      description: `${stats.pendingOrders} хүлээгдэж буй`,
      icon: ShoppingCart,
      iconBg:
        stats.pendingOrders > 0
          ? "bg-yellow-100 text-yellow-700"
          : "bg-green-100 text-green-700",
    },
    {
      title: stats.isFiltered ? "Хэрэглэгч" : "Нийт хэрэглэгч",
      value: stats.totalUsers.toLocaleString(),
      description: stats.isFiltered
        ? "Энэ сард бүртгүүлсэн"
        : "Бүртгэлтэй хэрэглэгчид",
      icon: Users,
      iconBg: "bg-purple-100 text-purple-700",
    },
    {
      title: stats.isFiltered ? "Орлого" : "Нийт орлого",
      value: `₮${stats.totalRevenue.toLocaleString()}`,
      description: "Төлөгдсөн захиалгууд",
      icon: CreditCard,
      iconBg: "bg-green-100 text-green-700",
    },
  ];

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="p-4 sm:pt-6 sm:px-6">
            <div className="flex items-center justify-between">
              <p className="text-xs sm:text-sm text-muted-foreground">
                {card.title}
              </p>
              <div className={`rounded-md p-1.5 sm:p-2 ${card.iconBg}`}>
                <card.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
            </div>
            <p className="mt-1 sm:mt-2 text-lg sm:text-2xl font-bold">
              {card.value}
            </p>
            <p className="text-[11px] sm:text-xs text-muted-foreground hidden sm:block">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
