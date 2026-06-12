"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Coins } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";

import { SelectedUserCard } from "./_SelectedUserCard";
import { UserSearchCombobox } from "./UserSearchCombobox";

import type { UserSearchResult } from "./types";

interface PointShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function validateShareInput(
  selectedUser: UserSearchResult | null,
  amount: string,
  description: string,
): { ok: true; numAmount: number } | { ok: false; error: string } {
  if (!selectedUser) return { ok: false, error: "Хэрэглэгч сонгоно уу" };
  const numAmount = parseInt(amount);
  if (!numAmount || numAmount <= 0) return { ok: false, error: "Зөв дүн оруулна уу" };
  if (!description.trim()) return { ok: false, error: "Тайлбар оруулна уу" };
  return { ok: true, numAmount };
}

export function PointShareDialog({ open, onOpenChange }: PointShareDialogProps) {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
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
    // Reset form state when the dialog closes so reopening starts clean.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!open) reset();
  }, [open, reset]);

  const mutation = useMutation({
    mutationFn: (data: { user_id: string; type: string; amount: number; description: string }) =>
      adminApi.insert("point_transactions", data),
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
    const validation = validateShareInput(selectedUser, amount, description);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }
    mutation.mutate({
      user_id: selectedUser!.id,
      type: "promotional",
      amount: validation.numAmount,
      description: description.trim(),
    });
  };

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
          <div className="space-y-2">
            <Label>Хэрэглэгч</Label>
            <UserSearchCombobox selectedUser={selectedUser} onSelect={setSelectedUser} />
          </div>

          {selectedUser && <SelectedUserCard user={selectedUser} />}

          <Separator />

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
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Өгөх
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
