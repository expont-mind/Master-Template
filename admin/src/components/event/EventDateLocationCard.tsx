"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";

interface EventDateLocationCardProps {
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  location: string;
  onLocationChange: (value: string) => void;
}

export function EventDateLocationCard({
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  location,
  onLocationChange,
}: EventDateLocationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Огноо & Байршил
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="startDate">Эхлэх огноо</Label>
            <Input
              id="startDate"
              type="datetime-local"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">Дуусах огноо</Label>
            <Input
              id="endDate"
              type="datetime-local"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Байршил</Label>
          <Input
            id="location"
            placeholder="Улаанбаатар, Монгол"
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
