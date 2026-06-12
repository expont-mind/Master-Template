"use client";

import { Plus, Tags, Search } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";

import { BrandCard } from "./BrandCard";
import { Brand } from "./types";

interface BrandGridProps {
  brands: Brand[];
  filteredBrands: Brand[];
  searchQuery: string;
  onDelete: (brand: Brand) => void;
}

export function BrandGrid({ brands, filteredBrands, searchQuery, onDelete }: BrandGridProps) {
  return (
    <CardContent className="px-0">
      {brands.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Tags className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Брэнд байхгүй</h3>
          <p className="text-sm text-muted-foreground mb-4">Эхний брэндээ нэмнэ үү</p>
          <Link href="/brands/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Шинэ брэнд
            </Button>
          </Link>
        </div>
      ) : filteredBrands.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Хайлтын илэрц байхгүй</h3>
          <p className="text-sm text-muted-foreground">
            &quot;{searchQuery}&quot; гэсэн брэнд олдсонгүй
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredBrands.map((brand) => (
            <BrandCard key={brand.id} brand={brand} onDelete={onDelete} />
          ))}
        </div>
      )}
    </CardContent>
  );
}
