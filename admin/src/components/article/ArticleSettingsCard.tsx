"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CONTENT_STATUS_LABELS } from "@/constants";
import { ARTICLE_TYPES } from "./types";
import type { ContentStatus } from "@/types/database";

interface ArticleSettingsCardProps {
  status: ContentStatus;
  onStatusChange: (status: ContentStatus) => void;
  type: string;
  onTypeChange: (type: string) => void;
  isFeatured: boolean;
  onIsFeaturedChange: (isFeatured: boolean) => void;
}

export function ArticleSettingsCard({
  status,
  onStatusChange,
  type,
  onTypeChange,
  isFeatured,
  onIsFeaturedChange,
}: ArticleSettingsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Тохиргоо</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Төлөв</Label>
          <Select
            value={status}
            onValueChange={(v) => onStatusChange(v as ContentStatus)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CONTENT_STATUS_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Төрөл</Label>
          <Select value={type} onValueChange={onTypeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ARTICLE_TYPES).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Онцлох нийтлэл</Label>
            <p className="text-xs text-muted-foreground">
              Нүүр хуудсанд харагдана
            </p>
          </div>
          <Switch checked={isFeatured} onCheckedChange={onIsFeaturedChange} />
        </div>
      </CardContent>
    </Card>
  );
}
