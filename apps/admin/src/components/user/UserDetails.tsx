"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useUserEdit } from "@/hooks/useUserEdit";

import { getFullName } from "./types";
import { UserEditHeader } from "./UserEditHeader";
import { UserInfoCard } from "./UserInfoCard";
import { UserNotesCard } from "./UserNotesCard";
import { UserOrdersCard } from "./UserOrdersCard";
import { UserPointHistoryCard } from "./UserPointHistoryCard";
import { UserSmsHistoryCard } from "./UserSmsHistoryCard";
import { UserStatsCard } from "./UserStatsCard";
import { UserStatusCard } from "./UserStatusCard";

interface UserDetailsProps {
  id: string;
}

export function UserDetails({ id }: UserDetailsProps) {
  const {
    user,
    orders,
    isLoading,
    isSaving,
    error,
    status,
    setStatus,
    handleSave,
    hasChanges,
    totalSpent,
    pointBalance,
    totalPointsUsed,
    totalPointsEarned,
  } = useUserEdit(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h3 className="text-lg font-medium">Хэрэглэгч олдсонгүй</h3>
        <Link href="/users">
          <Button variant="link">Буцах</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <UserEditHeader user={user} />

      {error && <div className="bg-destructive/10 text-destructive p-4 rounded-lg">{error}</div>}

      <div className="grid gap-6 md:grid-cols-3">
        <UserInfoCard user={user} />
        <UserStatsCard
          ordersCount={orders.length}
          totalSpent={totalSpent}
          pointBalance={pointBalance}
          totalPointsUsed={totalPointsUsed}
          totalPointsEarned={totalPointsEarned}
        />
        <UserStatusCard
          status={status}
          onStatusChange={setStatus}
          onSave={handleSave}
          hasChanges={hasChanges}
          isSaving={isSaving}
        />
      </div>

      <UserOrdersCard orders={orders} />

      <UserPointHistoryCard userId={id} userName={getFullName(user)} />

      <UserNotesCard userId={id} />

      {user.primary_phone && (
        <UserSmsHistoryCard userId={id} userName={getFullName(user)} phone={user.primary_phone} />
      )}
    </div>
  );
}
