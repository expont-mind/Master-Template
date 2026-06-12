"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddLoginEmailDialogProps {
  adminId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddLoginEmailDialog({
  adminId,
  open,
  onOpenChange,
  onSuccess,
}: AddLoginEmailDialogProps) {
  const [newEmail, setNewEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (!newEmail) return;
    setIsAdding(true);
    try {
      const res = await fetch("/api/admin/email-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_id: adminId, email: newEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Имэйл нэмэхэд алдаа гарлаа");
        return;
      }
      toast.success("Баталгаажуулах линк илгээгдлээ. Имэйлээ шалгана уу.");
      setNewEmail("");
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Имэйл нэмэхэд алдаа гарлаа");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDialogClose = (next: boolean) => {
    if (!next) setNewEmail("");
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Нэвтрэх имэйл нэмэх</DialogTitle>
          <DialogDescription>Нэмэлт нэвтрэх имэйл хаягаа оруулна уу</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newEmail">Имэйл хаяг</Label>
            <Input
              id="newEmail"
              type="email"
              placeholder="example@gmail.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              disabled={isAdding}
            />
          </div>
          <Button onClick={handleAdd} disabled={!newEmail || isAdding} className="w-full">
            {isAdding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Нэмж байна...
              </>
            ) : (
              "Нэмэх"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
