"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ImageUpload } from "@/components/ui/image-upload";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { translateServerError } from "@/lib/utils/error-messages";

export function BrandForm() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!name.trim()) {
        throw new Error("Брэндийн нэрийг заавал оруулна уу.");
      }

      if (!logoUrl) {
        throw new Error("Брэндийн логог заавал оруулна уу.");
      }

      // Generate slug from name
      const baseSlug = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/^-+|-+$/g, "");

      // If slug is empty (e.g., all Mongolian text), generate a random one
      const slug = baseSlug || `brand-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

      const brandData = {
        name: name.trim(),
        slug,
        logo_url: logoUrl,
      };

      await adminApi.insert("brands", brandData);

      router.push("/brands");
      router.refresh();
    } catch (err) {
      const errorMessage = translateServerError(err instanceof Error ? err.message : "", "Брэнд хадгалахад алдаа гарлаа.");
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/brands">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Шинэ брэнд</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto">
        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Брэндийн мэдээлэл</CardTitle>
            <CardDescription>Брэндийн нэр болон лого</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Нэр *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nike"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Лого *</Label>
              <div className="max-w-[200px]">
                <ImageUpload
                  value={logoUrl}
                  onChange={setLogoUrl}
                  onRemove={() => setLogoUrl("")}
                  aspectRatio="square"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Брэндийн лого зураг оруулна уу
              </p>
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
    </div>
  );
}
