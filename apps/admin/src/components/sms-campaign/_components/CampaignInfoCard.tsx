"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CampaignInfoCardProps {
  name: string;
  message: string;
  disabled: boolean;
  onChange: (patch: { name?: string; message?: string }) => void;
}

export function CampaignInfoCard({ name, message, disabled, onChange }: CampaignInfoCardProps) {
  const messageLength = message.length;
  return (
    <Card>
      <CardHeader>
        <CardTitle>SMS мэдээлэл</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Нэр</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Кампанийн нэр"
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="message">Мессеж</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => onChange({ message: e.target.value })}
            placeholder="SMS мессежийн текст..."
            rows={4}
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground">
            {messageLength} тэмдэгт
            {messageLength > 160 && (
              <span className="text-orange-600">
                {" "}
                (160-аас давсан, {Math.ceil(messageLength / 153)} SMS болно)
              </span>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
