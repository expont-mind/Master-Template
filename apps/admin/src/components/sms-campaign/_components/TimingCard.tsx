"use client";

import { Clock } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export type Timing = "now" | "scheduled";

interface TimingCardProps {
  timing: Timing;
  scheduledAt: string | null;
  onChangeTiming: (timing: Timing) => void;
  onChangeScheduledAt: (iso: string | null) => void;
}

export function TimingCard({
  timing,
  scheduledAt,
  onChangeTiming,
  onChangeScheduledAt,
}: TimingCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Илгээх хугацаа
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup value={timing} onValueChange={(v: string) => onChangeTiming(v as Timing)}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="now" id="timing-now" />
            <Label htmlFor="timing-now">Одоо илгээх</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="scheduled" id="timing-scheduled" />
            <Label htmlFor="timing-scheduled">Төлөвлөх</Label>
          </div>
        </RadioGroup>

        {timing === "scheduled" && (
          <DateTimePicker
            value={scheduledAt ? new Date(scheduledAt) : undefined}
            onChange={(date) => onChangeScheduledAt(date ? date.toISOString() : null)}
            placeholder="Илгээх огноо, цаг сонгох"
          />
        )}
      </CardContent>
    </Card>
  );
}
