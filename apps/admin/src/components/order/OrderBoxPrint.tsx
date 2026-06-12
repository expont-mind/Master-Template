import { Printer, Download, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

import { exportBoxLabelsToExcel } from "./_boxLabelsExcelExport";
import { OrderLabel } from "./_orderBoxLabel";

import type { OrderWithUser } from "./types";

export { fetchImageBuffer } from "./_boxLabelImage";

interface OrderBoxPrintSheetProps {
  orders: OrderWithUser[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrinted?: (orderIds: string[]) => void;
}

const PRINT_STYLE = `
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
    [data-print-content] { overflow: visible !important; padding: 0 !important; }
    .print\\:break-after-page { break-after: page; }
    .print\\:break-after-page:last-child { break-after: auto; }
  }
`;

function PrintHeaderActions({
  orderCount,
  isDownloading,
  onDownload,
  onPrint,
}: {
  orderCount: number;
  isDownloading: boolean;
  onDownload: () => void;
  onPrint: () => void;
}) {
  return (
    <SheetHeader className="flex flex-row items-center justify-between pr-8">
      <div>
        <SheetTitle>Хайрцагны хэвлэмэл</SheetTitle>
        <SheetDescription>{orderCount} захиалгын шошго</SheetDescription>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onDownload} disabled={isDownloading}>
          {isDownloading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {isDownloading ? "Татаж байна..." : "Татах"}
        </Button>
        <Button size="sm" onClick={onPrint}>
          <Printer className="h-4 w-4 mr-2" />
          Хэвлэх
        </Button>
      </div>
    </SheetHeader>
  );
}

export function OrderBoxPrintSheet({
  orders,
  open,
  onOpenChange,
  onPrinted,
}: OrderBoxPrintSheetProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    try {
      await exportBoxLabelsToExcel(orders);
      onPrinted?.(orders.map((o) => o.id));
    } finally {
      setIsDownloading(false);
    }
  }, [orders, onPrinted]);

  const handlePrint = useCallback(() => {
    window.print();
    onPrinted?.(orders.map((o) => o.id));
  }, [orders, onPrinted]);

  return (
    <>
      <style>{PRINT_STYLE}</style>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="sm:max-w-4xl w-full overflow-hidden flex flex-col">
          <PrintHeaderActions
            orderCount={orders.length}
            isDownloading={isDownloading}
            onDownload={handleDownload}
            onPrint={handlePrint}
          />
          <div data-print-content className="flex-1 overflow-y-auto px-4 pb-4">
            {orders.map((order, index) => (
              <div key={order.id}>
                {index > 0 && <hr className="border-dashed border-gray-300 my-6 print:hidden" />}
                <OrderLabel order={order} />
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
