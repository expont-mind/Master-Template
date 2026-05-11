"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import type { Attribute } from "./types";

interface ProductAttributesCardProps {
  selectedAttributes: string[];
  toggleAttribute: (attributeId: string) => void;
  availableAttributes: Attribute[];
}

export function ProductAttributesCard({
  selectedAttributes,
  toggleAttribute,
  availableAttributes,
}: ProductAttributesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Шинж чанарууд</CardTitle>
        <CardDescription>
          Бүтээгдэхүүнд ямар сонголтууд байхыг тохируулах (Өнгө, Хэмжээ гэх мэт)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {availableAttributes.map((attr) => (
            <Badge
              key={attr.id}
              variant={
                selectedAttributes.includes(attr.id) ? "default" : "outline"
              }
              className="cursor-pointer"
              onClick={() => toggleAttribute(attr.id)}
            >
              {attr.display_name}
              {selectedAttributes.includes(attr.id) && (
                <X className="ml-1 h-3 w-3" />
              )}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
