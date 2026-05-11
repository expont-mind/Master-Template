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
import {
  GripVertical,
  Trash2,
  Share2,
  X,
  Check,
  Pencil,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { platformOptions, getPlatformData } from "./platform-options";
import type { SocialLink } from "./types";

export interface SocialLinkItemProps {
  link: SocialLink;
  isEditing: boolean;
  editPlatform: string;
  editUrl: string;
  editIsActive: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSave: () => void;
  onCancel: () => void;
  onPlatformChange: (value: string) => void;
  onUrlChange: (value: string) => void;
  onIsActiveChange: (value: boolean) => void;
}

export function SocialLinkItem({
  link,
  isEditing,
  editPlatform,
  editUrl,
  editIsActive,
  isSaving,
  onEdit,
  onDelete,
  onSave,
  onCancel,
  onPlatformChange,
  onUrlChange,
  onIsActiveChange,
}: SocialLinkItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const platformData = getPlatformData(
    isEditing ? editPlatform : link.platform,
  );
  const IconComponent = platformData?.icon || Share2;
  const iconColor = platformData?.color;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-3 sm:p-4 border rounded-lg bg-card transition-colors"
    >
      <button
        {...attributes}
        {...listeners}
        className={
          isEditing
            ? "cursor-not-allowed opacity-50"
            : "cursor-grab active:cursor-grabbing touch-none"
        }
        disabled={isEditing}
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>

      <div
        className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: iconColor ? `${iconColor}15` : undefined }}
      >
        <IconComponent className="h-5 w-5" style={{ color: iconColor }} />
      </div>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Select
              value={editPlatform.toLowerCase()}
              onValueChange={onPlatformChange}
            >
              <SelectTrigger className="w-full sm:w-[140px] h-8">
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
              value={editUrl}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder="https://..."
              className="flex-1 h-8"
            />
          </div>
        ) : (
          <>
            <p className="font-medium">
              {platformData?.label || link.platform}
            </p>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-primary hover:underline inline-flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="truncate max-w-[160px] sm:max-w-[300px]">{link.url}</span>
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          </>
        )}
      </div>

      <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-auto">
        {isEditing ? (
          <>
            <Checkbox
              checked={editIsActive}
              onCheckedChange={(checked) => onIsActiveChange(checked === true)}
            />
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
          </>
        ) : (
          <>
            <span
              className={`px-2 py-1 text-xs rounded-full ${
                link.is_active
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {link.is_active ? "Идэвхтэй" : "Идэвхгүй"}
            </span>
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
