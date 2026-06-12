"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

const NAME_COLORS = [
  "#000000",
  "#EF4444",
  "#F97316",
  "#EAB308",
  "#22C55E",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#6B7280",
];

interface WarehouseBasicCardProps {
  name: string;
  onNameChange: (value: string) => void;
  code: string;
  onCodeChange: (value: string) => void;
  nameColor: string;
  onNameColorChange: (value: string) => void;
  address: string;
  onAddressChange: (value: string) => void;
  city: string;
  onCityChange: (value: string) => void;
  district: string;
  onDistrictChange: (value: string) => void;
}

export function WarehouseBasicCard({
  name,
  onNameChange,
  code,
  onCodeChange,
  nameColor,
  onNameColorChange,
  address,
  onAddressChange,
  city,
  onCityChange,
  district,
  onDistrictChange,
}: WarehouseBasicCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Үндсэн мэдээлэл</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Агуулахын нэр *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="name"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="Төв агуулах"
                className="flex-1"
                style={nameColor ? { color: nameColor } : undefined}
              />
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex h-9 items-center gap-1 rounded-md border border-input px-2 hover:bg-accent transition-colors"
                  >
                    {nameColor ? (
                      <span
                        className="h-5 w-5 rounded-full shrink-0"
                        style={{ backgroundColor: nameColor }}
                      />
                    ) : (
                      <span className="h-5 w-5 rounded-full shrink-0 border-2 border-dashed border-muted-foreground" />
                    )}
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="end">
                  <div className="grid grid-cols-5 gap-1.5">
                    {NAME_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          onNameColorChange(nameColor === color ? "" : color);
                          setOpen(false);
                        }}
                        className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                        style={{
                          backgroundColor: color,
                          borderColor: nameColor === color ? "white" : "transparent",
                          boxShadow: nameColor === color ? `0 0 0 2px ${color}` : "none",
                        }}
                      />
                    ))}
                  </div>
                  {nameColor && (
                    <button
                      type="button"
                      onClick={() => {
                        onNameColorChange("");
                        setOpen(false);
                      }}
                      className="mt-2 w-full text-xs text-muted-foreground hover:text-foreground text-center py-1"
                    >
                      Арилгах
                    </button>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Код</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => onCodeChange(e.target.value)}
              placeholder="WH-001"
              className="font-mono"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">Хот/Аймаг</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
              placeholder="Улаанбаатар"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="district">Дүүрэг/Сум</Label>
            <Input
              id="district"
              value={district}
              onChange={(e) => onDistrictChange(e.target.value)}
              placeholder="Баянзүрх"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Дэлгэрэнгүй хаяг</Label>
          <Textarea
            id="address"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="Агуулахын бүрэн хаяг"
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}
