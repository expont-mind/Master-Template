"use client";

// Background color picker section for BannerForm. Supports both the
// desktop (required) and mobile (optional) variant via the showClearButton
// prop.

import { Pipette, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BannerColorSectionProps {
  label: string;
  helpText?: string;
  color: string | null | undefined;
  fallbackColor?: string;
  showColorPickerButton: boolean;
  isPicking: boolean;
  pickerButtonLabel: { desktop: string; mobile: string };
  pickHintText: string;
  showClearButton?: boolean;
  onColorChange: (value: string | null) => void;
  onTogglePicking: () => void;
}

function ColorPickerButton({
  isPicking,
  label,
  onToggle,
}: {
  isPicking: boolean;
  label: { desktop: string; mobile: string };
  onToggle: () => void;
}) {
  return (
    <Button
      type="button"
      variant={isPicking ? "default" : "outline"}
      size="sm"
      onClick={onToggle}
      className="gap-2"
    >
      <Pipette className="h-4 w-4" />
      <span className="hidden sm:inline">{isPicking ? label.desktop : label.mobile}</span>
      <span className="sm:hidden">{isPicking ? "Сонгоно уу" : "Зургаас"}</span>
    </Button>
  );
}

function ClearColorButton({ onClear }: { onClear: () => void }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClear} className="gap-2">
      <X className="h-4 w-4" />
      Арилгах
    </Button>
  );
}

export function BannerColorSection({
  label,
  helpText,
  color,
  fallbackColor = "#ffffff",
  showColorPickerButton,
  isPicking,
  pickerButtonLabel,
  pickHintText,
  showClearButton,
  onColorChange,
  onTogglePicking,
}: BannerColorSectionProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg border-2 shadow-sm"
          style={{ backgroundColor: color || fallbackColor }}
        />
        <Input
          value={color ?? ""}
          onChange={(e) => onColorChange(e.target.value || null)}
          placeholder="#ffffff"
          className="w-28 sm:w-32 font-mono"
        />
        <input
          type="color"
          value={color || fallbackColor}
          onChange={(e) => onColorChange(e.target.value)}
          className="w-10 h-10 rounded cursor-pointer border-0 p-0"
        />
        {showColorPickerButton && (
          <ColorPickerButton
            isPicking={isPicking}
            label={pickerButtonLabel}
            onToggle={onTogglePicking}
          />
        )}
        {showClearButton && color && <ClearColorButton onClear={() => onColorChange(null)} />}
      </div>
      {isPicking && <p className="text-sm text-muted-foreground">{pickHintText}</p>}
    </div>
  );
}
