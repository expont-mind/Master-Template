"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DateCell, ActionsCell } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Mail, MailOpen } from "lucide-react";
import { NOTIFICATION_TYPE_LABELS } from "@/constants";
import type { Notification } from "./types";
import type { NotificationType } from "@/types/database";

export function getColumns(options: {
  onDelete?: (notification: Notification) => void;
}): ColumnDef<Notification>[] {
  return [
    {
      id: "is_read",
      header: "",
      size: 48,
      cell: ({ row }) =>
        row.original.is_read ? (
          <MailOpen className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Mail className="h-4 w-4 text-primary" />
        ),
    },
    {
      id: "title_body",
      header: "Гарчиг",
      cell: ({ row }) => (
        <div>
          <p
            className={`font-medium ${
              !row.original.is_read ? "text-primary" : ""
            }`}
          >
            {row.original.title || "Гарчиггүй"}
          </p>
          {row.original.body && (
            <p className="text-sm text-muted-foreground truncate max-w-[300px]">
              {row.original.body}
            </p>
          )}
        </div>
      ),
    },
    {
      id: "type",
      header: "Төрөл",
      size: 120,
      cell: ({ row }) => (
        <Badge variant="outline">
          {NOTIFICATION_TYPE_LABELS[row.original.type as NotificationType]}
        </Badge>
      ),
    },
    {
      id: "user",
      header: "Хэрэглэгч",
      size: 140,
      cell: ({ row }) => {
        const fullName = [row.original.users?.first_name, row.original.users?.last_name]
          .filter(Boolean)
          .join(' ');
        return row.original.users ? (
          <span className="text-sm">
            {fullName || row.original.users.email}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Огноо",
      size: 160,
      cell: ({ row }) => (
        <DateCell value={row.original.created_at} showTime />
      ),
    },
    {
      id: "actions",
      header: "",
      size: 60,
      cell: ({ row }) => (
        <ActionsCell
          onDelete={() => options.onDelete?.(row.original)}
        />
      ),
    },
  ];
}
