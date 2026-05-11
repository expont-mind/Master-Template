"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TopCoupon {
  code: string;
  type: string;
  usage_count: number;
  total_discount: number;
}

interface TopCouponsTableProps {
  data: TopCoupon[];
  isLoading: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  percentage: "Хувь",
  fixed: "Тогтмол",
};

export function TopCouponsTable({ data, isLoading }: TopCouponsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Шилдэг купонууд</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[250px] w-full animate-pulse rounded bg-muted" />
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            Мэдээлэл байхгүй байна
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-2 text-left font-medium">Код</th>
                  <th className="py-2 text-left font-medium">Төрөл</th>
                  <th className="py-2 text-right font-medium">Хэрэглэсэн</th>
                  <th className="py-2 text-right font-medium">Нийт хөнгөлөлт</th>
                </tr>
              </thead>
              <tbody>
                {data.map((c) => (
                  <tr key={c.code} className="border-b last:border-0">
                    <td className="py-2 font-mono text-xs">{c.code}</td>
                    <td className="py-2">
                      <Badge variant="secondary" className="text-xs">
                        {TYPE_LABELS[c.type] ?? c.type}
                      </Badge>
                    </td>
                    <td className="py-2 text-right">{c.usage_count}</td>
                    <td className="py-2 text-right font-medium">₮{Number(c.total_discount).toLocaleString()}</td>
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
