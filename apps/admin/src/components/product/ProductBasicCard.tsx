"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PRODUCT_STATUS_LABELS } from "@/constants";

import type { ProductStatus } from "@/types/database";

interface ProductBasicCardProps {
  name: string;
  setName: (value: string) => void;
  slug: string;
  setSlug: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  status: ProductStatus;
  setStatus: (value: ProductStatus) => void;
  generateSlug: (text: string) => string;
}

export function ProductBasicCard({
  name,
  setName,
  slug,
  setSlug,
  description,
  setDescription,
  status,
  setStatus,
  generateSlug,
}: ProductBasicCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Үндсэн мэдээлэл</CardTitle>
        <CardDescription>Бүтээгдэхүүний нэр, тайлбар</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Нэр *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slug) setSlug(generateSlug(e.target.value));
              }}
              placeholder="Nike Air Max 90"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="nike-air-max-90"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Тайлбар</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Бүтээгдэхүүний дэлгэрэнгүй тайлбар..."
            rows={4}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Төлөв</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as ProductStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PRODUCT_STATUS_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
