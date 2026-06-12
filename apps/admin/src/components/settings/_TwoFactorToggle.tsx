"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { adminApi } from "@/lib/admin-api";

interface TwoFactorToggleProps {
  adminId: string;
  initialEnabled: boolean;
}

export function TwoFactorToggle({ adminId, initialEnabled }: TwoFactorToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async (next: boolean) => {
    setIsToggling(true);
    try {
      await adminApi.update("admins", adminId, { two_factor_enabled: next });
      setEnabled(next);
      toast.success(
        next
          ? "Хоёр шатлалт баталгаажуулалт идэвхжлээ"
          : "Хоёр шатлалт баталгаажуулалт идэвхгүй боллоо",
      );
    } catch {
      toast.error("Тохиргоо хадгалахад алдаа гарлаа");
      setEnabled(!next);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label className="text-base">Хоёр шатлалт баталгаажуулалт (2FA)</Label>
        <p className="text-sm text-muted-foreground">
          {enabled ? "Имэйлээр OTP код ашиглан нэвтэрч байна" : "Имэйл оруулахад шууд нэвтэрнэ"}
        </p>
      </div>
      <Button
        variant={enabled ? "default" : "outline"}
        size="sm"
        onClick={() => handleToggle(!enabled)}
        disabled={isToggling}
      >
        {isToggling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {enabled ? "Идэвхжсэн" : "Идэвхжүүлэх"}
      </Button>
    </div>
  );
}
