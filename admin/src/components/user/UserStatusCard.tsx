"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { USER_STATUS_LABELS } from "@/constants";
import type { UserStatus } from "@/types/database";

interface UserStatusCardProps {
  status: UserStatus;
  onStatusChange: (status: UserStatus) => void;
  onSave: () => void;
  hasChanges: boolean;
  isSaving: boolean;
}

export function UserStatusCard({
  status,
  onStatusChange,
  onSave,
  hasChanges,
  isSaving,
}: UserStatusCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Төлөв өөрчлөх</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Хэрэглэгчийн төлөв</Label>
          <Select
            value={status}
            onValueChange={(v) => onStatusChange(v as UserStatus)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(USER_STATUS_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={onSave}
          disabled={!hasChanges || isSaving}
          className="w-full"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Хадгалж байна...
            </>
          ) : (
            "Хадгалах"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
