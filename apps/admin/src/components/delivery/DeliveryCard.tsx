"use client";

import { Edit, Trash2, Truck, MoreHorizontal } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { DeliveryZone } from "./types";

interface DeliveryCardProps {
  zone: DeliveryZone;
  onDelete: (zone: DeliveryZone) => void;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("mn-MN").format(amount) + "₮";
}

export function DeliveryCard({ zone, onDelete }: DeliveryCardProps) {
  return (
    <Link
      href={`/deliveries/${zone.id}`}
      className="group relative flex flex-col p-6 border rounded-lg hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
          <Truck className="h-6 w-6 text-muted-foreground" />
        </div>
        <Badge
          variant={zone.is_active ? "default" : "outline"}
          className={zone.is_active ? "bg-green-100 text-green-800" : ""}
        >
          {zone.is_active ? "Идэвхтэй" : "Идэвхгүй"}
        </Badge>
      </div>

      <p className="text-lg font-medium mb-1">{zone.name}</p>
      {zone.description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{zone.description}</p>
      )}

      <div className="mt-auto space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Хүргэлтийн үнэ:</span>
          <span className="font-medium">{formatCurrency(zone.delivery_fee)}</span>
        </div>
        {zone.is_free_delivery_enabled && zone.free_delivery_threshold && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Үнэгүй хүргэлт:</span>
            <span className="font-medium">{formatCurrency(zone.free_delivery_threshold)}+</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Хугацаа:</span>
          <span className="font-medium">
            {zone.estimated_days_min === zone.estimated_days_max
              ? `${zone.estimated_days_min} өдөр`
              : `${zone.estimated_days_min}-${zone.estimated_days_max} өдөр`}
          </span>
        </div>
      </div>

      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- wrapper only blocks Link navigation; DropdownMenu items are keyboard-accessible */}
      <div onClick={(e) => e.preventDefault()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/deliveries/${zone.id}`}>
                <Edit className="mr-2 h-4 w-4" />
                Засах
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => onDelete(zone)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Устгах
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Link>
  );
}
