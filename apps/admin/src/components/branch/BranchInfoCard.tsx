"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { Branch } from "./types";

interface BranchInfoCardProps {
  branch: Branch;
}

export function BranchInfoCard({ branch }: BranchInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Мэдээлэл</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Үүсгэсэн:</span>
          <span>
            {new Date(branch.created_at).toLocaleDateString("mn-MN", {
              timeZone: "Asia/Ulaanbaatar",
            })}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Шинэчилсэн:</span>
          <span>
            {new Date(branch.updated_at).toLocaleDateString("mn-MN", {
              timeZone: "Asia/Ulaanbaatar",
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
