"use client";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  DollarSign,
  ShoppingCart,
  UserPlus,
  TrendingUp,
  XCircle,
  Star,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  change?: number;
  icon: LucideIcon;
  iconColor: string;
}

function KpiCard({ title, value, change, icon: Icon, iconColor }: KpiCardProps) {
  const hasChange = change !== undefined && change !== null;
  const isPositive = hasChange && change >= 0;

  return (
    <Card className="py-4">
      <CardContent className="px-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className={cn("rounded-md p-1.5", iconColor)}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-2 text-2xl font-bold">{value}</p>
        {hasChange && (
          <div className="mt-1 flex items-center gap-1 text-xs">
            {isPositive ? (
              <ArrowUpRight className="h-3.5 w-3.5 text-green-600" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 text-red-600" />
            )}
            <span className={isPositive ? "text-green-600" : "text-red-600"}>
              {Math.abs(change).toFixed(1)}%
            </span>
            <span className="text-muted-foreground">өмнөх үеэс</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function pctChange(current: number, previous: number): number | undefined {
  if (previous === 0) return current > 0 ? 100 : undefined;
  return ((current - previous) / previous) * 100;
}

interface KpiCardsProps {
  totalRevenue: number;
  prevRevenue: number;
  totalOrders: number;
  prevOrders: number;
  newUsers: number;
  prevNewUsers: number;
  averageOrderValue: number;
  cancellationRate: number;
  avgRating: number;
  isLoading: boolean;
}

export function KpiCards({
  totalRevenue,
  prevRevenue,
  totalOrders,
  prevOrders,
  newUsers,
  prevNewUsers,
  averageOrderValue,
  cancellationRate,
  avgRating,
  isLoading,
}: KpiCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[120px] w-full animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  const cards: KpiCardProps[] = [
    {
      title: "Нийт орлого",
      value: `₮${totalRevenue.toLocaleString()}`,
      change: pctChange(totalRevenue, prevRevenue),
      icon: DollarSign,
      iconColor: "bg-green-100 text-green-800",
    },
    {
      title: "Захиалга",
      value: totalOrders.toLocaleString(),
      change: pctChange(totalOrders, prevOrders),
      icon: ShoppingCart,
      iconColor: "bg-blue-100 text-blue-800",
    },
    {
      title: "Шинэ хэрэглэгч",
      value: newUsers.toLocaleString(),
      change: pctChange(newUsers, prevNewUsers),
      icon: UserPlus,
      iconColor: "bg-purple-100 text-purple-800",
    },
    {
      title: "Дундаж захиалга",
      value: `₮${Math.round(averageOrderValue).toLocaleString()}`,
      icon: TrendingUp,
      iconColor: "bg-orange-100 text-orange-800",
    },
    {
      title: "Цуцлалтын хувь",
      value: `${cancellationRate.toFixed(1)}%`,
      icon: XCircle,
      iconColor: "bg-red-100 text-red-800",
    },
    {
      title: "Дундаж үнэлгээ",
      value: `${avgRating.toFixed(1)} / 5`,
      icon: Star,
      iconColor: "bg-yellow-100 text-yellow-800",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <KpiCard key={card.title} {...card} />
      ))}
    </div>
  );
}
