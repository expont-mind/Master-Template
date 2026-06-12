"use client";

import { Plus, Truck, Search } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";

import { DeliveryCard } from "./DeliveryCard";
import { DeliveryZone } from "./types";

interface DeliveryGridProps {
  zones: DeliveryZone[];
  filteredZones: DeliveryZone[];
  searchQuery: string;
  onDelete: (zone: DeliveryZone) => void;
}

export function DeliveryGrid({ zones, filteredZones, searchQuery, onDelete }: DeliveryGridProps) {
  return (
    <CardContent className="px-0">
      {zones.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Truck className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Хүргэлтийн бүс байхгүй</h3>
          <p className="text-sm text-muted-foreground mb-4">Эхний хүргэлтийн бүсээ нэмнэ үү</p>
          <Link href="/deliveries/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Шинэ бүс
            </Button>
          </Link>
        </div>
      ) : filteredZones.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Хайлтын илэрц байхгүй</h3>
          <p className="text-sm text-muted-foreground">
            &quot;{searchQuery}&quot; гэсэн бүс олдсонгүй
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredZones.map((zone) => (
            <DeliveryCard key={zone.id} zone={zone} onDelete={onDelete} />
          ))}
        </div>
      )}
    </CardContent>
  );
}
