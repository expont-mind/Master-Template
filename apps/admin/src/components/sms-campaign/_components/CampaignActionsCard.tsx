"use client";

import { Clock, Loader2, Save, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import type { Timing } from "./TimingCard";

interface CampaignActionsCardProps {
  timing: Timing;
  isSaving: boolean;
  isSending: boolean;
  onSaveDraft: () => void;
  onSchedule: () => void;
  onConfirmSend: () => void;
}

export function CampaignActionsCard({
  timing,
  isSaving,
  isSending,
  onSaveDraft,
  onSchedule,
  onConfirmSend,
}: CampaignActionsCardProps) {
  const isBusy = isSaving || isSending;
  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        <Button variant="outline" className="w-full" onClick={onSaveDraft} disabled={isBusy}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Ноорог хадгалах
        </Button>

        {timing === "scheduled" ? (
          <Button className="w-full" onClick={onSchedule} disabled={isBusy}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Clock className="mr-2 h-4 w-4" />
            Төлөвлөх
          </Button>
        ) : (
          <Button className="w-full" onClick={onConfirmSend} disabled={isBusy}>
            {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Send className="mr-2 h-4 w-4" />
            Илгээх
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
