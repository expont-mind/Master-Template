"use client";

import { Download, Loader2, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { ProductsPrintTable } from "./_productsPrintTable";

import type { GroupedProduct } from "./_productGrouping";

const PRINT_STYLES = `
@media print {
  body > *:not([data-slot="sheet-overlay"]):not(:has([data-print-content])) {
    display: none !important;
  }
  [data-slot="sheet-overlay"] { display: none !important; }
  [data-slot="sheet-content"] {
    position: static !important;
    width: 100% !important;
    max-width: 100% !important;
    border: none !important;
    box-shadow: none !important;
    transform: none !important;
    animation: none !important;
  }
  [data-slot="sheet-header"] { display: none !important; }
  [data-slot="sheet-close"] { display: none !important; }
  [data-print-content] {
    overflow: visible !important;
    padding: 0 !important;
  }
}
`;

interface OrderProductsPrintSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filtered: GroupedProduct[];
  totalProductCount: number;
  totalItems: number;
  orderCount: number;
  onDownload: () => void;
  isDownloading: boolean;
  onPrinted?: () => void;
}

export function OrderProductsPrintSheet({
  open,
  onOpenChange,
  filtered,
  totalProductCount,
  totalItems,
  orderCount,
  onDownload,
  isDownloading,
  onPrinted,
}: OrderProductsPrintSheetProps) {
  return (
    <>
      {open && <style>{PRINT_STYLES}</style>}
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="sm:max-w-4xl w-full overflow-hidden flex flex-col">
          <SheetHeader className="flex flex-row items-center justify-between pr-8">
            <div>
              <SheetTitle>Бараа жагсаалт</SheetTitle>
              <SheetDescription>
                {totalProductCount} бараа · {totalItems} ширхэг · {orderCount} захиалга
              </SheetDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onDownload} disabled={isDownloading}>
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Татах
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  window.print();
                  onPrinted?.();
                }}
              >
                <Printer className="h-4 w-4 mr-2" />
                Хэвлэх
              </Button>
            </div>
          </SheetHeader>
          <div data-print-content className="flex-1 overflow-y-auto px-4 pb-4">
            <ProductsPrintTable groups={filtered} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
