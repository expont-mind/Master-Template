"use client";

import { ArrowLeft, User } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { USER_STATUS_LABELS, USER_STATUS_COLORS } from "@/constants";

import { type User as UserType, getFullName } from "./types";

interface UserEditHeaderProps {
  user: UserType;
}

export function UserEditHeader({ user }: UserEditHeaderProps) {
  const router = useRouter();
  const fullName = getFullName(user);
  return (
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="icon" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
        {user.avatar_url ? (
          <Image
            src={user.avatar_url}
            alt={fullName}
            width={48}
            height={48}
            className="h-full w-full object-cover"
          />
        ) : (
          <User className="h-6 w-6 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1">
        <h2 className="text-3xl font-bold tracking-tight">{fullName}</h2>
        <p className="text-muted-foreground">{user.email}</p>
      </div>
      <Badge variant="secondary" className={USER_STATUS_COLORS[user.status]}>
        {USER_STATUS_LABELS[user.status]}
      </Badge>
    </div>
  );
}
