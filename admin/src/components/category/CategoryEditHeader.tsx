"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function CategoryEditHeader() {
  const router = useRouter();
  return (
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="icon" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <h2 className="text-3xl font-bold tracking-tight">Ангилал засах</h2>
    </div>
  );
}
