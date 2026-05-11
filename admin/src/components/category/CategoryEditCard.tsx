"use client";

import Link from "next/link";
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
import { Loader2 } from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";
import { Category } from "./types";

interface CategoryEditCardProps {
  name: string;
  parentId: string;
  image: string;
  availableParents: Category[];
  isLoading: boolean;
  error: string | null;
  onNameChange: (value: string) => void;
  onParentChange: (value: string) => void;
  onImageChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function CategoryEditCard({
  name,
  parentId,
  image,
  availableParents,
  isLoading,
  error,
  onNameChange,
  onParentChange,
  onImageChange,
  onSubmit,
}: CategoryEditCardProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-2xl mx-auto">
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Ангилалын мэдээлэл</CardTitle>
          <CardDescription>
            Ангилалын нэр болон эцэг ангилалыг засах
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Нэр *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Гутал"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Зураг</Label>
            <ImageUpload
              value={image}
              onChange={onImageChange}
              onRemove={() => onImageChange("")}
              aspectRatio="video"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parent">Эцэг ангилал</Label>
            <Select
              value={parentId || "none"}
              onValueChange={(v) => onParentChange(v === "none" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Үндсэн ангилал (сонгохгүй)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Үндсэн ангилал</SelectItem>
                {availableParents.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Ангилалын байршлыг өөрчлөхийн тулд эцэг ангилалыг сонгоно уу
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
  );
}
