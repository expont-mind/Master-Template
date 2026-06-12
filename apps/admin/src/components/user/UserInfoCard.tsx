"use client";

import { User, Mail, Phone, Calendar, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { User as UserType } from "./types";

interface UserInfoCardProps {
  user: UserType;
}

export function UserInfoCard({ user }: UserInfoCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("mn-MN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "Asia/Ulaanbaatar",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Хэрэглэгчийн мэдээлэл
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span>{user.email}</span>
        </div>
        {user.primary_phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{user.primary_phone}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>Бүртгүүлсэн: {formatDate(user.created_at)}</span>
        </div>

        {user.addresses?.length > 0 && (
          <div className="pt-2 border-t space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>Хаягууд</span>
            </div>
            {user.addresses.map((addr) => {
              const parts = [addr.city, addr.district, addr.sub_district, addr.detail].filter(
                Boolean,
              );
              return (
                <div
                  key={addr.id}
                  className="ml-6 text-sm text-muted-foreground flex items-start gap-2"
                >
                  <span className="leading-5">{parts.join(", ") || "Хаяг байхгүй"}</span>
                  {addr.is_default && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                      Үндсэн
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
