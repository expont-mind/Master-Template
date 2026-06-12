"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SmsCampaign {
  id: string;
  name: string;
  status: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
}

interface SmsCampaignTableProps {
  data: SmsCampaign[];
  isLoading: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  sent: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  draft: "bg-gray-100 text-gray-800",
  failed: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  sent: "Илгээсэн",
  pending: "Хүлээгдэж буй",
  draft: "Ноорог",
  failed: "Алдаатай",
};

export function SmsCampaignTable({ data, isLoading }: SmsCampaignTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>SMS кампанит ажил</CardTitle>
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
                  <th className="py-2 text-left font-medium">Нэр</th>
                  <th className="py-2 text-left font-medium">Төлөв</th>
                  <th className="py-2 text-right font-medium">Илгээсэн</th>
                  <th className="py-2 text-right font-medium">Огноо</th>
                </tr>
              </thead>
              <tbody>
                {data.map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="py-2 truncate max-w-[200px]">{c.name}</td>
                    <td className="py-2">
                      <Badge
                        variant="secondary"
                        className={`text-xs ${STATUS_COLORS[c.status] ?? ""}`}
                      >
                        {STATUS_LABELS[c.status] ?? c.status}
                      </Badge>
                    </td>
                    <td className="py-2 text-right">
                      {c.sent_count}/{c.total_recipients}
                    </td>
                    <td className="py-2 text-right text-muted-foreground text-xs">
                      {new Date(c.created_at).toLocaleDateString("mn-MN")}
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
