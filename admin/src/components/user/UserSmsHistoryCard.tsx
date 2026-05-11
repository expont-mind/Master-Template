"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BadgeCell, DateCell } from "@/components/ui/data-table";
import { MessageSquare, Send } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";
import { SMS_LOG_STATUS_LABELS, SMS_LOG_STATUS_COLORS } from "@/constants";
import { SendSmsDialog } from "./SendSmsDialog";

interface SmsLog {
  id: string;
  phone: string;
  message: string;
  status: string;
  created_at: string;
}

interface UserSmsHistoryCardProps {
  userId: string;
  userName: string;
  phone: string;
}

export function UserSmsHistoryCard({
  userId,
  userName,
  phone,
}: UserSmsHistoryCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: queryKeys.smsLogs.byUser(userId),
    queryFn: () =>
      adminApi.getAll<SmsLog>("sms_logs", {
        select: "id, phone, message, status, created_at",
        filters: { "user_id.eq": userId },
        order: "created_at.desc",
        limit: 20,
      }),
  });

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5" />
            SMS түүх
          </CardTitle>
          <Button size="sm" className="gap-1" onClick={() => setDialogOpen(true)}>
            <Send className="h-4 w-4" />
            SMS илгээх
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              SMS түүх байхгүй
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Огноо</th>
                    <th className="pb-2 font-medium">Мессеж</th>
                    <th className="pb-2 font-medium">Төлөв</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b last:border-0">
                      <td className="py-2.5 whitespace-nowrap">
                        <DateCell value={log.created_at} showTime />
                      </td>
                      <td className="py-2.5 max-w-[300px] truncate text-muted-foreground">
                        {log.message}
                      </td>
                      <td className="py-2.5">
                        <BadgeCell
                          value={log.status}
                          labels={SMS_LOG_STATUS_LABELS}
                          colors={SMS_LOG_STATUS_COLORS}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <SendSmsDialog
        userId={userId}
        userName={userName}
        phone={phone}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
