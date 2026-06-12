"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

interface ProductEditHeaderProps {
  isNew: boolean;
  isSaving: boolean;
  onSave: () => void;
}

export function ProductEditHeader({ isNew, isSaving, onSave }: ProductEditHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/products" className="hover:text-foreground transition-colors">
          Бүтээгдэхүүн
        </Link>
        <span>{">"}</span>
        <span className="text-foreground">
          {isNew ? "Бүтээгдэхүүн нэмэх" : "Бүтээгдэхүүн засах"}
        </span>
      </nav>
      <Button onClick={onSave} disabled={isSaving}>
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Хадгалж байна...
          </>
        ) : (
          "Хадгалах"
        )}
      </Button>
    </div>
  );
}
