"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";
import Link from "next/link";
import { Category } from "./types";
import { translateServerError } from "@/lib/utils/error-messages";

export function CategoryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const parentIdFromUrl = searchParams.get("parent");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [parentId, setParentId] = useState<string>(parentIdFromUrl || "");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await adminApi.getAll<Category>("categories", {
          select: "id, name, parent_id",
          order: "name.asc",
        });
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!name.trim()) {
        throw new Error("Ангилалын нэрийг заавал оруулна уу.");
      }

      // Generate slug from name
      const baseSlug = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-");

      // If slug is empty (e.g., all Mongolian text), generate a random one
      const slug = baseSlug || `category-${Date.now()}`;

      const categoryData = {
        name: name.trim(),
        slug,
        image: image || null,
        parent_id: parentId || null,
      };

      await adminApi.insert("categories", categoryData);

      router.push("/categories");
      router.refresh();
    } catch (err) {
      const errorMessage = translateServerError(err instanceof Error ? err.message : "", "Ангилал хадгалахад алдаа гарлаа.");
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/categories">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>

        <h2 className="text-3xl font-bold tracking-tight">Шинэ ангилал</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto">
        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Ангилалын мэдээлэл</CardTitle>
            <CardDescription>
              Ангилалын нэр болон эцэг ангилалыг сонгоно уу
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Нэр *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Гутал"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Зураг</Label>
              <ImageUpload
                value={image}
                onChange={setImage}
                onRemove={() => setImage("")}
                aspectRatio="video"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent">Эцэг ангилал</Label>
              <Select
                value={parentId || "none"}
                onValueChange={(v) => setParentId(v === "none" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Үндсэн ангилал (сонгохгүй)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Үндсэн ангилал</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Дэд ангилал үүсгэхийн тулд эцэг ангилалыг сонгоно уу
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href="/categories">
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
