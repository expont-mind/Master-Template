import { CalendarDays, DollarSign, UserPlus } from "lucide-react";
import type { DashboardStats } from "./types";

interface TodayHighlightsProps {
  stats: DashboardStats;
}

export function TodayHighlights({ stats }: TodayHighlightsProps) {
  const cards = [
    {
      title: "Өнөөдрийн захиалга",
      value: stats.todayOrdersCount.toLocaleString(),
      icon: CalendarDays,
      color: "border-blue-200 bg-blue-50/50",
      iconColor: "text-blue-600",
    },
    {
      title: "Өнөөдрийн орлого",
      value: `₮${stats.todayRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "border-green-200 bg-green-50/50",
      iconColor: "text-green-600",
    },
    {
      title: "Шинэ хэрэглэгч",
      value: stats.todayNewUsers.toLocaleString(),
      icon: UserPlus,
      color: "border-purple-200 bg-purple-50/50",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div>
      <h3 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Өнөөдрийн тойм
      </h3>
      <div className="grid gap-3 sm:gap-4 grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`rounded-lg border p-3 sm:p-4 ${card.color}`}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <card.icon
                className={`h-4 w-4 sm:h-5 sm:w-5 shrink-0 ${card.iconColor}`}
              />
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                  {card.title}
                </p>
                <p className="text-sm sm:text-xl font-bold truncate">
                  {card.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
