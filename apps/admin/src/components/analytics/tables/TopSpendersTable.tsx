"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { TopSpender } from "@/components/analytics/business/types";

interface TopSpendersTableProps {
  data: TopSpender[];
  isLoading: boolean;
}

export function TopSpendersTable({ data, isLoading }: TopSpendersTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Шилдэг 10 худалдан авагч</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] w-full animate-pulse rounded bg-muted" />
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            Мэдээлэл байхгүй байна
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-2 text-left font-medium">#</th>
                  <th className="py-2 text-left font-medium">Нэр</th>
                  <th className="py-2 text-left font-medium">Утас</th>
                  <th className="py-2 text-right font-medium">Захиалга</th>
                  <th className="py-2 text-right font-medium">Нийт зарцуулсан</th>
                </tr>
              </thead>
              <tbody>
                {data.map((s, i) => (
                  <tr key={s.user_id} className="border-b last:border-0">
                    <td className="py-2 text-muted-foreground">{i + 1}</td>
                    <td className="py-2">
                      {[s.last_name, s.first_name].filter(Boolean).join(" ") || s.email || "—"}
                    </td>
                    <td className="py-2 text-muted-foreground">{s.primary_phone || "—"}</td>
                    <td className="py-2 text-right">{s.order_count}</td>
                    <td className="py-2 text-right font-medium">
                      ₮{Number(s.total_spent).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
