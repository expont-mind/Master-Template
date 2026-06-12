"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function BrandEditHeader() {
  const router = useRouter();
  return (
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="icon" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <h2 className="text-3xl font-bold tracking-tight">Брэнд засах</h2>
    </div>
  );
}
