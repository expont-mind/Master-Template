"use client";

import { Store } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface BranchBasicCardProps {
  name: string;
  onNameChange: (value: string) => void;
  address: string;
  onAddressChange: (value: string) => void;
  weekdayHours: string;
  onWeekdayHoursChange: (value: string) => void;
  weekendHours: string;
  onWeekendHoursChange: (value: string) => void;
}

export function BranchBasicCard({
  name,
  onNameChange,
  address,
  onAddressChange,
  weekdayHours,
  onWeekdayHoursChange,
  weekendHours,
  onWeekendHoursChange,
}: BranchBasicCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5" />
          Үндсэн мэдээлэл
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Салбарын нэр *</Label>
          <Input
            id="name"
            placeholder="Жишээ: Төв оффис"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Хаяг</Label>
          <Textarea
            id="address"
            placeholder="Санто таур 4 давхар, 405 тоот,&#10;СБД, 3-р хороо, 5-р хороолол, Усны гудамж,&#10;Улаанбаатар хот, Монгол Улс"
            rows={4}
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Хаягийг мөр тус бүрд бичвэл илүү сайн харагдана
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="weekdayHours">Ажлын өдрийн цаг</Label>
            <Input
              id="weekdayHours"
              placeholder="Да-Бя 09:00-18:00"
              value={weekdayHours}
              onChange={(e) => onWeekdayHoursChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weekendHours">Амралтын өдрийн цаг</Label>
            <Input
              id="weekendHours"
              placeholder="Ня 09:14-21:14"
              value={weekendHours}
              onChange={(e) => onWeekendHoursChange(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
