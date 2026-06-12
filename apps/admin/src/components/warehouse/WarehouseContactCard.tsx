"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WarehouseContactCardProps {
  phone: string;
  onPhoneChange: (value: string) => void;
  email: string;
  onEmailChange: (value: string) => void;
  managerName: string;
  onManagerNameChange: (value: string) => void;
}

export function WarehouseContactCard({
  phone,
  onPhoneChange,
  email,
  onEmailChange,
  managerName,
  onManagerNameChange,
}: WarehouseContactCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Холбоо барих</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="managerName">Менежер / Хариуцагч</Label>
          <Input
            id="managerName"
            value={managerName}
            onChange={(e) => onManagerNameChange(e.target.value)}
            placeholder="Бат-Эрдэнэ"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Утас</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder="+976 99001122"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">И-мэйл</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="warehouse@example.com"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
