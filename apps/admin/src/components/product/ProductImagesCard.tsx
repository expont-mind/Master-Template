"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MultiImageUpload } from "@/components/ui/image-upload";

interface ProductImagesCardProps {
  images: string[];
  setImages: (images: string[]) => void;
  disabled?: boolean;
}

export function ProductImagesCard({ images, setImages, disabled }: ProductImagesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Зураг</CardTitle>
        <CardDescription>Бүтээгдэхүүний зургууд (эхний зураг үндсэн зураг болно)</CardDescription>
      </CardHeader>
      <CardContent>
        <MultiImageUpload values={images} onChange={setImages} disabled={disabled} maxImages={10} />
      </CardContent>
    </Card>
  );
}
