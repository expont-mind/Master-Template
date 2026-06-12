"use client";

import { Megaphone } from "lucide-react";
import Image from "next/image";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AdsContentCardProps {
  title: string;
  onTitleChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  imageUrl: string;
  onImageUrlChange: (value: string) => void;
  linkUrl: string;
  onLinkUrlChange: (value: string) => void;
}

export function AdsContentCard({
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  imageUrl,
  onImageUrlChange,
  linkUrl,
  onLinkUrlChange,
}: AdsContentCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5" />
          Зарын агуулга
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Гарчиг *</Label>
          <Input
            id="title"
            placeholder="Зарын гарчиг"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Тайлбар</Label>
          <Textarea
            id="description"
            placeholder="Зарын тайлбар..."
            rows={3}
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="imageUrl">Зураг URL *</Label>
          <Input
            id="imageUrl"
            placeholder="https://example.com/image.jpg"
            value={imageUrl}
            onChange={(e) => onImageUrlChange(e.target.value)}
          />
          {imageUrl && (
            <div className="mt-2 relative max-w-xs aspect-3/2 rounded-lg border overflow-hidden">
              <Image
                src={imageUrl}
                alt="Ad preview"
                fill
                sizes="320px"
                className="object-cover"
                unoptimized
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="linkUrl">Холбоос URL</Label>
          <Input
            id="linkUrl"
            placeholder="https://example.com/promo"
            value={linkUrl}
            onChange={(e) => onLinkUrlChange(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Зар дээр дарахад очих хаяг</p>
        </div>
      </CardContent>
    </Card>
  );
}
