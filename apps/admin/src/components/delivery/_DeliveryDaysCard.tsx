"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DeliveryDaysCardProps {
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  onEstimatedDaysMinChange: (value: number) => void;
  onEstimatedDaysMaxChange: (value: number) => void;
}

export function DeliveryDaysCard({
  estimatedDaysMin,
  estimatedDaysMax,
  onEstimatedDaysMinChange,
  onEstimatedDaysMaxChange,
}: DeliveryDaysCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Хүргэлтийн хугацаа</CardTitle>
        <CardDescription>Тооцоолсон хүргэлтийн хугацаа (өдрөөр)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="estimatedDaysMin">Хамгийн бага (өдөр)</Label>
            <Input
              id="estimatedDaysMin"
              type="number"
              value={estimatedDaysMin}
              onChange={(e) => onEstimatedDaysMinChange(Number(e.target.value))}
              min={1}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="estimatedDaysMax">Хамгийн их (өдөр)</Label>
            <Input
              id="estimatedDaysMax"
              type="number"
              value={estimatedDaysMax}
              onChange={(e) => onEstimatedDaysMaxChange(Number(e.target.value))}
              min={1}
              required
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
