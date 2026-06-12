"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const QR_TEMPLATES = [
  { value: "simple", label: "Энгийн" },
  { value: "logo", label: "Лого бүхий" },
  { value: "color", label: "Өнгөт" },
] as const;

interface QrCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName?: string;
  onSave?: (data: { message: string; template: string }) => void;
}

export function QrCodeDialog({
  open,
  onOpenChange,
  productName: _productName,
  onSave,
}: QrCodeDialogProps) {
  const [message, setMessage] = useState("");
  const [template, setTemplate] = useState("simple");

  const handleSave = () => {
    onSave?.({ message, template });
    setMessage("");
    setTemplate("simple");
    onOpenChange(false);
  };

  const handleCancel = () => {
    setMessage("");
    setTemplate("simple");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">QR код үүсгэх</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 pb-1.5">
          <div className="flex flex-col gap-3">
            <Label>Your message</Label>
            <Textarea
              placeholder="Type your message here."
              className="min-h-[80px] resize-y"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2.5">
            <Label>QR кодын загвар</Label>
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Энгийн" />
              </SelectTrigger>
              <SelectContent>
                {QR_TEMPLATES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Буцах
          </Button>
          <Button onClick={handleSave}>Хадгалах</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
