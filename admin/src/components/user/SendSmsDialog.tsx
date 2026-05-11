"use client";

import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare } from "lucide-react";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";

interface SendSmsDialogProps {
  userId: string;
  userName: string;
  phone: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CYRILLIC_SMS_LIMIT = 70;

export function SendSmsDialog({
  userId,
  userName,
  phone,
  open,
  onOpenChange,
}: SendSmsDialogProps) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setMessage("");
    setError(null);
    setIsSending(false);
  }, []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const smsSegments = Math.max(1, Math.ceil(message.length / CYRILLIC_SMS_LIMIT));

  const handleSend = async () => {
    setError(null);

    if (!message.trim()) {
      setError("Мессеж оруулна уу");
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch("/api/admin/sms/send-single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          message: message.trim(),
          user_id: userId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "SMS илгээхэд алдаа гарлаа");
        return;
      }

      queryClient.invalidateQueries({
        queryKey: queryKeys.smsLogs.byUser(userId),
      });
      toast.success("SMS амжилттай илгээгдлээ");
      onOpenChange(false);
    } catch {
      setError("SMS илгээхэд алдаа гарлаа");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            SMS илгээх
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipient info */}
          <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
            <p className="text-sm font-medium">{userName}</p>
            <p className="text-sm text-muted-foreground">{phone}</p>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="sms-message">Мессеж</Label>
            <Textarea
              id="sms-message"
              placeholder="SMS мессеж бичих..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              autoFocus
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{message.length} тэмдэгт</span>
              <span>
                {smsSegments} SMS ({CYRILLIC_SMS_LIMIT} тэмдэгт/SMS)
              </span>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
          >
            Болих
          </Button>
          <Button onClick={handleSend} disabled={isSending || !message.trim()}>
            {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Илгээх
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
