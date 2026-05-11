"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ui/image-upload";
import { Loader2, Settings } from "lucide-react";
import { useBrandSectionSettings } from "@/hooks/useBrandSectionSettings";
import { useState } from "react";

export function BrandSectionSettings() {
  const {
    title,
    setTitle,
    iconUrl,
    setIconUrl,
    isLoading,
    isSaving,
    hasChanges,
    save,
    error,
  } = useBrandSectionSettings();

  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setSuccess(false);
    try {
      await save();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      // error is handled by the hook
    }
  };

  if (isLoading) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings className="h-4 w-4" />
          Брэнд хэсгийн тохиргоо
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div className="space-y-2">
            <Label htmlFor="brand-section-title">Хэсгийн нэр</Label>
            <Input
              id="brand-section-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Брэндүүд"
            />
          </div>
          <div className="space-y-2">
            <Label>Хэсгийн icon</Label>
            <div className="w-[100px]">
              <ImageUpload
                value={iconUrl}
                onChange={setIconUrl}
                onRemove={() => setIconUrl("")}
                aspectRatio="square"
                hideText
              />
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex items-center gap-2">
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            size="sm"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Хадгалах
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
