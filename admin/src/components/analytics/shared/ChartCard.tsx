"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  children: ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  height?: number;
}

export function ChartCard({ title, children, isLoading, isEmpty, height = 300 }: ChartCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="w-full animate-pulse rounded bg-muted" style={{ height }} />
        ) : isEmpty ? (
          <div className="flex items-center justify-center text-muted-foreground" style={{ height }}>
            Мэдээлэл байхгүй байна
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
