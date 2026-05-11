"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "@/components/ui/date-time-picker";

interface EventMainCardProps {
  title: string;
  setTitle: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  videoUrl: string;
  setVideoUrl: (value: string) => void;
  startDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;
  endDate: Date | undefined;
  setEndDate: (date: Date | undefined) => void;
}

export function EventMainCard({
  title,
  setTitle,
  description,
  setDescription,
  location,
  setLocation,
  videoUrl,
  setVideoUrl,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}: EventMainCardProps) {
  return (
    <Card>
      <CardContent className="p-6 space-y-8">
        <h2 className="text-xl font-semibold">Эвентийн мэдээлэл</h2>

        <div className="space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <Label>Гарчиг *</Label>
            <Input
              placeholder="Эвентийн нэрээ оруулна уу"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Start Date + End Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DateTimePicker
              label="Эхлэх огноо"
              value={startDate}
              onChange={setStartDate}
              placeholder="Эхлэх огноо сонгох"
            />
            <DateTimePicker
              label="Дуусах огноо"
              value={endDate}
              onChange={setEndDate}
              placeholder="Дуусах огноо сонгох"
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label>Байршил</Label>
            <Input
              placeholder="MISHEEL EXPO International exhibiton center"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Video URL */}
          <div className="space-y-2">
            <Label>Видео URL (YouTube)</Label>
            <Input
              placeholder="https://www.youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              YouTube видеоны линк оруулна уу
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Тайлбар</Label>
            <Textarea
              placeholder="Эвентийн дэлгэрэнгүй тайлбар..."
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
