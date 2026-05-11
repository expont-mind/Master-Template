"use client";

import { useState, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Loader2, Coins, Mail, Phone, ShieldCheck } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";
import { UserSearchCombobox } from "./UserSearchCombobox";
import type { UserSearchResult } from "./types";

interface PointShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getInitials(user: UserSearchResult): string {
  const first = user.first_name?.[0] ?? "";
  const last = user.last_name?.[0] ?? "";
  return (first + last).toUpperCase() || user.email?.[0]?.toUpperCase() || "?";
}

export function PointShareDialog({
  open,
  onOpenChange,
}: PointShareDialogProps) {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(
    null,
  );
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setSelectedUser(null);
    setAmount("");
    setDescription("");
    setError(null);
  }, []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const mutation = useMutation({
    mutationFn: (data: {
      user_id: string;
      type: string;
      amount: number;
      description: string;
    }) => adminApi.insert("point_transactions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.pointTransactions.all,
      });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = () => {
    setError(null);

    if (!selectedUser) {
      setError("Хэрэглэгч сонгоно уу");
      return;
    }

    const numAmount = parseInt(amount);
    if (!numAmount || numAmount <= 0) {
      setError("Зөв дүн оруулна уу");
      return;
    }

    if (!description.trim()) {
      setError("Тайлбар оруулна уу");
      return;
    }

    mutation.mutate({
      user_id: selectedUser.id,
      type: "promotional",
      amount: numAmount,
      description: description.trim(),
    });
  };

  const fullName = selectedUser
    ? [selectedUser.first_name, selectedUser.last_name]
        .filter(Boolean)
        .join(" ") || "-"
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[375px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Point өгөх
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Selection */}
          <div className="space-y-2">
            <Label>Хэрэглэгч</Label>
            <UserSearchCombobox
              selectedUser={selectedUser}
              onSelect={setSelectedUser}
            />
          </div>

          {/* Selected User Info */}
          {selectedUser && (
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="flex items-start gap-3.5">
                <Avatar className="size-11 mt-0.5">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                    {getInitials(selectedUser)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm truncate">
                      {fullName}
                    </span>
                    {selectedUser.point_activated_at ? (
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
                      <span className="truncate">{selectedUser.email}</span>
                    </div>
                    {selectedUser.primary_phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="size-3.5 shrink-0" />
                        <span>{selectedUser.primary_phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="point-amount">Дүн</Label>
            <div className="relative">
              <Input
                id="point-amount"
                type="number"
                min="1"
                placeholder="10,000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pr-14"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-muted-foreground pointer-events-none">
                <Coins className="size-3.5" />
                <span className="text-xs font-medium">MP</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="point-description">Тайлбар</Label>
            <Textarea
              id="point-description"
              placeholder="Урамшуулал, бонус гэх мэт..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Болих
          </Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Өгөх
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
