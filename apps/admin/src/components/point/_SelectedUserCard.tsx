"use client";

import { Mail, Phone, ShieldCheck } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import type { UserSearchResult } from "./types";

function getInitials(user: UserSearchResult): string {
  const first = user.first_name?.[0] ?? "";
  const last = user.last_name?.[0] ?? "";
  return (first + last).toUpperCase() || user.email?.[0]?.toUpperCase() || "?";
}

interface SelectedUserCardProps {
  user: UserSearchResult;
}

export function SelectedUserCard({ user }: SelectedUserCardProps) {
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ") || "-";

  return (
    <div className="rounded-xl border bg-muted/30 p-4">
      <div className="flex items-start gap-3.5">
        <Avatar className="size-11 mt-0.5">
          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
            {getInitials(user)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm truncate">{fullName}</span>
            {user.point_activated_at ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700 shrink-0">
                <ShieldCheck className="size-3" />
                Идэвхтэй
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500 shrink-0">
                Идэвхжүүлээгүй
              </span>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="size-3.5 shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
            {user.primary_phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="size-3.5 shrink-0" />
                <span>{user.primary_phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
