"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Coins, Plus, Minus } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";

interface UserPointManageDialogProps {
  userId: string;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserPointManageDialog({
  userId,
  userName,
  open,
  onOpenChange,
}: UserPointManageDialogProps) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"add" | "deduct">("add");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setMode("add");
    setAmount("");
    setDescription("");
    setError(null);
  }, []);

  useEffect(() => {
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
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.detail(userId),
      });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = () => {
    setError(null);

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
      user_id: userId,
      type: mode === "add" ? "promotional" : "used",
      amount: mode === "add" ? numAmount : -numAmount,
      description: description.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Point удирдах — {userName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode Toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "add" ? "default" : "outline"}
              size="sm"
              className="flex-1 gap-1"
              onClick={() => setMode("add")}
            >
              <Plus className="h-4 w-4" />
              Нэмэх
            </Button>
            <Button
              type="button"
              variant={mode === "deduct" ? "destructive" : "outline"}
              size="sm"
              className="flex-1 gap-1"
              onClick={() => setMode("deduct")}
            >
              <Minus className="h-4 w-4" />
              Хасах
            </Button>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="manage-point-amount">Дүн</Label>
            <div className="relative">
              <Input
                id="manage-point-amount"
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
            <Label htmlFor="manage-point-description">Тайлбар</Label>
            <Textarea
              id="manage-point-description"
              placeholder={mode === "add" ? "Урамшуулал, бонус гэх мэт..." : "Хасах шалтгаан..."}
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
          <Button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            variant={mode === "deduct" ? "destructive" : "default"}
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "add" ? "Нэмэх" : "Хасах"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
