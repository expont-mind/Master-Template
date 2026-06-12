"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface DeliveryBasicCardProps {
  name: string;
  description: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

export function DeliveryBasicCard({
  name,
  description,
  onNameChange,
  onDescriptionChange,
}: DeliveryBasicCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Үндсэн мэдээлэл</CardTitle>
        <CardDescription>Хүргэлтийн бүсийн нэр, тайлбар</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Бүсийн нэр *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Улаанбаатар"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Тайлбар</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Улаанбаатар хот доторх хүргэлт"
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}
