"use client";

import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  Coins,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUserAnalytics } from "@/hooks/useUserAnalytics";

import {
  PointDistributionCard,
  StatusDistributionCard,
  UserGrowthCard,
} from "./_UserAnalyticsCharts";

function KpiCard({
  title,
  value,
  delta,
  icon: Icon,
}: {
  title: string;
  value: string;
  delta?: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{title}</p>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <p className="text-2xl font-bold">{value}</p>
          {delta !== undefined && delta !== 0 && (
            <span
              className={`text-xs font-medium ${delta > 0 ? "text-green-600" : "text-red-600"}`}
            >
              {delta > 0 ? "+" : ""}
              {delta}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function UserAnalyticsKpis({
  totalUsers,
  newUsersCount,
  newUsersDelta,
  activeUsers,
  avgPointBalance,
}: {
  totalUsers: number;
  newUsersCount: number;
  newUsersDelta: number;
  activeUsers: number;
  avgPointBalance: number;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <KpiCard title="Нийт хэрэглэгч" value={totalUsers.toLocaleString()} icon={Users} />
      <KpiCard
        title="Шинэ хэрэглэгч (энэ сар)"
        value={newUsersCount.toLocaleString()}
        delta={newUsersDelta}
        icon={UserPlus}
      />
      <KpiCard title="Идэвхтэй" value={activeUsers.toLocaleString()} icon={TrendingUp} />
      <KpiCard title="Дундаж Point" value={avgPointBalance.toLocaleString() + "P"} icon={Coins} />
    </div>
  );
}

const ANALYTICS_SKELETON_IDS = ["k1", "k2", "k3", "k4"] as const;

function AnalyticsLoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {ANALYTICS_SKELETON_IDS.map((id) => (
        <div key={id} className="h-24 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  );
}

export function UserAnalyticsSection() {
  const [isOpen, setIsOpen] = useState(false);
  const analytics = useUserAnalytics();

  if (!isOpen) {
    return (
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsOpen(true)}>
        <BarChart3 className="h-4 w-4" />
        Статистик харуулах
        <ChevronDown className="h-4 w-4" />
      </Button>
    );
  }

  const {
    totalUsers,
    activeUsers,
    newUsersCount,
    prevNewUsersCount,
    avgPointBalance,
    usersByDay,
    statusDistribution,
    pointDistribution,
    isLoading,
  } = analytics;

  const newUsersDelta =
    prevNewUsersCount > 0
      ? Math.round(((newUsersCount - prevNewUsersCount) / prevNewUsersCount) * 100)
      : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsOpen(false)}>
          <BarChart3 className="h-4 w-4" />
          Статистик нуух
          <ChevronUp className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <AnalyticsLoadingSkeleton />
      ) : (
        <>
          <UserAnalyticsKpis
            totalUsers={totalUsers}
            newUsersCount={newUsersCount}
            newUsersDelta={newUsersDelta}
            activeUsers={activeUsers}
            avgPointBalance={avgPointBalance}
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <UserGrowthCard data={usersByDay} />
            <StatusDistributionCard data={statusDistribution} />
          </div>
          <PointDistributionCard data={pointDistribution} />
        </>
      )}
    </div>
  );
}
