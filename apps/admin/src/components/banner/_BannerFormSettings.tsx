"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface BannerFormSettingsProps {
  type: "carousel" | "promo";
  onTypeChange: (t: "carousel" | "promo") => void;
  sortOrder: number;
  onSortOrderChange: (n: number) => void;
  isActive: boolean;
  onIsActiveChange: (b: boolean) => void;
}

export function BannerFormSettings({
  type,
  onTypeChange,
  sortOrder,
  onSortOrderChange,
  isActive,
  onIsActiveChange,
}: BannerFormSettingsProps) {
  return (
    <>
      <BannerTypeToggle type={type} onChange={onTypeChange} />

      <div className="space-y-2">
        <Label htmlFor="sort_order">Эрэмбэ</Label>
        <Input
          id="sort_order"
          type="number"
          value={sortOrder}
          onChange={(e) => onSortOrderChange(parseInt(e.target.value) || 0)}
          placeholder="0"
        />
      </div>

      <div className="flex items-center justify-between py-2">
        <div className="space-y-0.5">
          <Label htmlFor="is_active">Идэвхтэй</Label>
          <p className="text-sm text-muted-foreground">Баннерийг харуулах эсэх</p>
        </div>
        <Switch id="is_active" checked={isActive} onCheckedChange={onIsActiveChange} />
      </div>
    </>
  );
}

function BannerTypeToggle({
  type,
  onChange,
}: {
  type: "carousel" | "promo";
  onChange: (t: "carousel" | "promo") => void;
}) {
  return (
    <div className="space-y-2">
      <Label>Баннерын төрөл</Label>
      <div className="grid grid-cols-2 rounded-lg border p-1 bg-muted/30">
        <button
          type="button"
          onClick={() => onChange("carousel")}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            type === "carousel"
              ? "bg-white shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Carousel (Слайдер)
        </button>
        <button
          type="button"
          onClick={() => onChange("promo")}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            type === "promo"
              ? "bg-white shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Promo (Хуудас дотор)
        </button>
      </div>
      <p className="text-sm text-muted-foreground">
        {type === "carousel"
          ? "Нүүр хуудасны дээд хэсгийн слайдерт харагдана"
          : "Нүүр хуудасны дунд хэсэгт тусдаа харагдана"}
      </p>
    </div>
  );
}
