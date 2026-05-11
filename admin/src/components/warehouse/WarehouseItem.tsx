"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, MapPin, Phone, Mail, User, Star, Package } from "lucide-react";
import type { Warehouse } from "./types";
import { WAREHOUSE_TYPE_LABELS } from "./types";

interface WarehouseItemProps {
  warehouse: Warehouse;
  onDelete: () => void;
}

export function WarehouseItem({ warehouse, onDelete }: WarehouseItemProps) {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-muted/50">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link
            href={`/warehouses/${warehouse.id}`}
            className="font-medium hover:underline truncate"
          >
            {warehouse.name}
          </Link>
          {warehouse.code && (
            <Badge variant="outline" className="font-mono">
              {warehouse.code}
            </Badge>
          )}
          {warehouse.is_default && (
            <Badge variant="default" className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              Үндсэн
            </Badge>
          )}
          <Badge variant="secondary">
            {WAREHOUSE_TYPE_LABELS[warehouse.type]}
          </Badge>
          <Badge variant={warehouse.is_active ? "secondary" : "outline"}>
            {warehouse.is_active ? "Идэвхтэй" : "Идэвхгүй"}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-muted-foreground">
          {warehouse.address && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {warehouse.city && `${warehouse.city}, `}
              {warehouse.district && `${warehouse.district}`}
            </span>
          )}
          {warehouse.phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {warehouse.phone}
            </span>
          )}
          {warehouse.manager_name && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {warehouse.manager_name}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link href={`/warehouses/${warehouse.id}`}>
          <Button variant="ghost" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          disabled={warehouse.is_default}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
