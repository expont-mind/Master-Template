"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CalendarDays } from "lucide-react";

interface EventContentCardProps {
  title: string;
  onTitleChange: (value: string) => void;
  slug: string;
  onSlugChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  imageUrl: string;
  onImageUrlChange: (value: string) => void;
  videoUrl: string;
  onVideoUrlChange: (value: string) => void;
}

export function EventContentCard({
  title,
  onTitleChange,
  slug,
  onSlugChange,
  description,
  onDescriptionChange,
  imageUrl,
  onImageUrlChange,
  videoUrl,
  onVideoUrlChange,
}: EventContentCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Эвентийн агуулга
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Гарчиг *</Label>
          <Input
            id="title"
            placeholder="Эвентийн нэр"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">URL (slug)</Label>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">/events/</span>
            <Input
              id="slug"
              placeholder="url-slug"
              value={slug}
              onChange={(e) => onSlugChange(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Хоосон үлдээвэл гарчигаас автоматаар үүснэ
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Тайлбар</Label>
          <Textarea
            id="description"
            placeholder="Эвентийн дэлгэрэнгүй тайлбар..."
            rows={6}
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="imageUrl">Зураг URL</Label>
          <Input
            id="imageUrl"
            placeholder="https://example.com/image.jpg"
            value={imageUrl}
            onChange={(e) => onImageUrlChange(e.target.value)}
          />
          {imageUrl && (
            <div className="mt-2">
              <img
                src={imageUrl}
                alt="Event preview"
                className="max-w-xs rounded-lg border"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="videoUrl">Видео URL (YouTube)</Label>
          <Input
            id="videoUrl"
            placeholder="https://www.youtube.com/watch?v=..."
            value={videoUrl}
            onChange={(e) => onVideoUrlChange(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            YouTube видеоны линк оруулна уу
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
