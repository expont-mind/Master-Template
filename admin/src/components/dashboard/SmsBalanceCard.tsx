"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MessageSquare, Plus, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/admin-api";

interface SmsBalanceCardProps {
  balance: number;
  spent: number;
  sentCount: number;
}

const BANK_ACCOUNT = "MN900004000410147416";

async function upsertSmsBalance(newAmount: number) {
  // Try to find existing setting
  const existing = await adminApi.getAll<{ id: string; key: string }>(
    "settings",
    { filters: { "key.eq": "sms_balance" }, limit: 1 },
  );

  if (existing.length > 0) {
    await adminApi.update("settings", existing[0].id, {
      value: { amount: newAmount },
    });
  } else {
    await adminApi.insert("settings", {
      key: "sms_balance",
      value: { amount: newAmount },
      description: "SMS дансны цэнэглэсэн дүн",
      group_name: "sms",
    });
  }
}

export function SmsBalanceCard({
  balance,
  spent,
  sentCount,
}: SmsBalanceCardProps) {
  const remaining = balance - spent;
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleFill() {
    const num = Number(amount);
    if (!num || num <= 0) {
      toast.error("Дүн оруулна уу");
      return;
    }

    setLoading(true);
    try {
      await upsertSmsBalance(balance + num);
      toast.success(`₮${num.toLocaleString()} амжилттай цэнэглэлээ`);
      setAmount("");
      setOpen(false);
      window.location.reload();
    } catch {
      toast.error("Алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(BANK_ACCOUNT);
    setCopied(true);
    toast.success("Дансны дугаар хуулагдлаа");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card>
      <CardContent className="p-4 sm:pt-6 sm:px-6">
        <div className="flex items-center justify-between">
          <p className="text-xs sm:text-sm text-muted-foreground">
            SMS үлдэгдэл
          </p>
          <div className="rounded-md p-1.5 sm:p-2 bg-orange-100 text-orange-700">
            <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
        </div>
        <p
          className={`mt-1 sm:mt-2 text-lg sm:text-2xl font-bold ${remaining < 0 ? "text-red-600" : ""}`}
        >
          ₮{remaining.toLocaleString()}
        </p>
        <div className="text-[11px] sm:text-xs text-muted-foreground hidden sm:block space-y-0.5">
          <p>
            Цэнэглэсэн: ₮{balance.toLocaleString()} / Зарцуулсан: ₮
            {spent.toLocaleString()}
          </p>
          <p>{sentCount.toLocaleString()} мессеж илгээсэн</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Цэнэглэх
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>SMS данс цэнэглэх</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="rounded-lg border p-3 bg-muted/50 space-y-2">
                <p className="text-sm font-medium">Дансны дугаар</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono bg-background rounded px-2 py-1.5 border">
                    {BANK_ACCOUNT}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Цэнэглэх дүн</p>
                <Input
                  type="number"
                  placeholder="Дүн оруулах..."
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Та дансаар шилжүүлсний дараа expontmind талд мэдэгдээрэй
              </p>

              <Button
                onClick={handleFill}
                disabled={loading || !amount}
                className="w-full"
              >
                {loading ? "Хадгалж байна..." : "Цэнэглэсэн дүн хадгалах"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
