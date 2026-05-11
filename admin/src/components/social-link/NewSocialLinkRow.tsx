"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GripVertical, Share2, X, Check, Loader2 } from "lucide-react";
import { platformOptions, getPlatformData } from "./platform-options";

export interface NewSocialLinkRowProps {
  platform: string;
  url: string;
  isActive: boolean;
  isSaving: boolean;
  onPlatformChange: (value: string) => void;
  onUrlChange: (value: string) => void;
  onIsActiveChange: (value: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function NewSocialLinkRow({
  platform,
  url,
  isActive,
  isSaving,
  onPlatformChange,
  onUrlChange,
  onIsActiveChange,
  onSave,
  onCancel,
}: NewSocialLinkRowProps) {
  const platformData = getPlatformData(platform);
  const IconComponent = platformData?.icon || Share2;
  const iconColor = platformData?.color;

  return (
    <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-3 sm:p-4 border border-dashed rounded-lg bg-card">
      <div className="opacity-50 hidden sm:block">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>

      <div
        className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: iconColor ? `${iconColor}15` : undefined }}
      >
        <IconComponent className="h-5 w-5" style={{ color: iconColor }} />
      </div>

      <div className="flex-1 min-w-0 flex flex-col sm:flex-row gap-2 sm:gap-3">
        <Select value={platform} onValueChange={onPlatformChange}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Платформ" />
          </SelectTrigger>
          <SelectContent>
            {platformOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <option.icon
                    className="h-4 w-4"
                    style={{ color: option.color }}
                  />
                  {option.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://facebook.com/yourpage"
          className="flex-1"
        />

        <div className="flex items-center gap-2">
          <Checkbox
            checked={isActive}
            onCheckedChange={(checked) => onIsActiveChange(checked === true)}
          />
          <span className="text-sm whitespace-nowrap">Идэвхтэй</span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 ml-auto">
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          disabled={isSaving}
        >
          <X className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4 text-green-600" />
          )}
        </Button>
      </div>
    </div>
  );
}
