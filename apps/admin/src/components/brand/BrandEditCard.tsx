"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BrandEditCardProps {
  name: string;
  logoUrl: string;
  isLoading: boolean;
  error: string | null;
  onNameChange: (value: string) => void;
  onLogoChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function BrandEditCard({
  name,
  logoUrl,
  isLoading,
  error,
  onNameChange,
  onLogoChange,
  onSubmit,
}: BrandEditCardProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-2xl mx-auto">
      {error && <div className="bg-destructive/10 text-destructive p-4 rounded-lg">{error}</div>}
      <Card>
        <CardHeader>
          <CardTitle>Брэндийн мэдээлэл</CardTitle>
          <CardDescription>Брэндийн нэр болон лого засах</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Нэр *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Nike"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Лого *</Label>
            <div className="max-w-[200px]">
              <ImageUpload
                value={logoUrl}
                onChange={onLogoChange}
                onRemove={() => onLogoChange("")}
                aspectRatio="square"
              />
            </div>
            <p className="text-sm text-muted-foreground">Брэндийн лого зураг оруулна уу</p>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end gap-4">
        <Link href="/brands">
          <Button type="button" variant="outline">
            Болих
          </Button>
        </Link>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Хадгалж байна...
            </>
          ) : (
            "Хадгалах"
          )}
        </Button>
      </div>
    </form>
  );
}
