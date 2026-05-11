"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, ImageIcon, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Brand } from "./types";

interface BrandCardProps {
  brand: Brand;
  onDelete: (brand: Brand) => void;
}

export function BrandCard({ brand, onDelete }: BrandCardProps) {
  return (
    <Link
      href={`/brands/${brand.id}`}
      className="group relative flex flex-col items-center p-8 border rounded-lg hover:bg-muted/50 transition-colors"
    >
      <div className="h-32 w-32 rounded-lg flex items-center justify-center overflow-hidden mb-4">
        {brand.logo_url ? (
          <img
            src={brand.logo_url}
            alt={brand.name}
            className="h-full w-full object-contain"
          />
        ) : (
          <ImageIcon className="h-10 w-10 text-muted-foreground" />
        )}
      </div>
      <p className="text-lg font-medium text-center truncate w-full">
        {brand.name}
      </p>
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
              <Link href={`/brands/${brand.id}`}>
                <Edit className="mr-2 h-4 w-4" />
                Засах
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(brand)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Устгах
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Link>
  );
}
