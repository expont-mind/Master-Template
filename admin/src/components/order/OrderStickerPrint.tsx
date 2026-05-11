import type { OrderWithUser } from "./types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

/**
 * CL426 Sticker Label Sheet
 * Paper: A4 (210 x 297mm)
 * Label: 99.6 x 46.4mm, 2 columns x 6 rows = 12 labels per page
 * Margins: top 10mm, left 4mm, col gap 2.5mm
 */

function StickerLabel({ order }: { order: OrderWithUser }) {
  const customerName =
    [order.users?.first_name, order.users?.last_name]
      .filter(Boolean)
      .join(" ") || "-";
  const phone = order.users?.primary_phone || "-";
  const address =
    [order.delivery_city, order.delivery_district, order.delivery_sub_district, order.delivery_detail]
      .filter(Boolean)
      .join(", ") || "-";
  const orderNumber = order.order_number || order.id.slice(0, 8).toUpperCase();

  return (
    <div className="sticker-label border border-gray-300 rounded-sm overflow-hidden px-[3mm] py-[2mm]">
      <div className="flex items-baseline justify-between gap-1">
        <div className="text-[12px] font-bold truncate leading-none">{customerName}</div>
        <div className="text-[9px] text-gray-400 shrink-0">#{orderNumber}</div>
      </div>
      <div className="text-[10px] font-medium leading-none mt-[3px]">{phone}</div>
      <div className="text-[9px] text-gray-600 leading-snug line-clamp-2 mt-[3px]">{address}</div>
    </div>
  );
}

interface OrderStickerPrintSheetProps {
  orders: OrderWithUser[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrinted?: (orderIds: string[]) => void;
}

export function OrderStickerPrintSheet({
  orders,
  open,
  onOpenChange,
  onPrinted,
}: OrderStickerPrintSheetProps) {
  const pages: OrderWithUser[][] = [];
  for (let i = 0; i < orders.length; i += 12) {
    pages.push(orders.slice(i, i + 12));
  }

  return (
    <>
      {open && (
        <style>{`
          @media print {
            @page {
              size: A4;
              margin: 0;
            }
            body > *:not([data-slot="sheet-overlay"]):not(:has([data-print-content])) {
              display: none !important;
            }
            [data-slot="sheet-overlay"] {
              display: none !important;
            }
            [data-slot="sheet-content"] {
              position: static !important;
              width: 100% !important;
              max-width: 100% !important;
              border: none !important;
              box-shadow: none !important;
              transform: none !important;
              animation: none !important;
            }
            [data-slot="sheet-header"] {
              display: none !important;
            }
            [data-slot="sheet-close"] {
              display: none !important;
            }
            [data-print-content] {
              overflow: visible !important;
              padding: 0 !important;
            }
            .sticker-page {
              width: 210mm;
              height: 297mm;
              padding: 10mm 4mm 0 4mm;
              display: grid !important;
              grid-template-columns: 99.6mm 99.6mm;
              grid-template-rows: repeat(6, 46.4mm);
              column-gap: 2.5mm;
              row-gap: 0mm;
              page-break-after: always;
              box-sizing: border-box;
            }
            .sticker-page:last-child {
              page-break-after: auto;
            }
            .sticker-label {
              width: 99.6mm;
              height: 46.4mm;
              border: none !important;
              border-radius: 0 !important;
              box-sizing: border-box;
            }
            .sticker-preview-hint {
              display: none !important;
            }
          }
        `}</style>
      )}
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="sm:max-w-4xl w-full overflow-hidden flex flex-col">
          <SheetHeader className="flex flex-row items-center justify-between pr-8">
            <div>
              <SheetTitle>Хайрцагны шошго (CL426)</SheetTitle>
              <SheetDescription>
                {orders.length} захиалга · {pages.length} хуудас
              </SheetDescription>
            </div>
            <Button size="sm" onClick={() => {
              window.print();
              onPrinted?.(orders.map((o) => o.id));
            }}>
              <Printer className="h-4 w-4 mr-2" />
              Хэвлэх
            </Button>
          </SheetHeader>
          <div
            data-print-content
            className="flex-1 overflow-y-auto px-4 pb-4"
          >
            <p className="sticker-preview-hint text-xs text-muted-foreground mb-3">
              CL426 шошгон цаас (99.6×46.4мм, 12 ширхэг/хуудас)
            </p>
            {pages.map((pageOrders, pageIdx) => (
              <div
                key={pageIdx}
                className="sticker-page grid grid-cols-2 gap-2 mb-6"
              >
                {pageOrders.map((order) => (
                  <StickerLabel key={order.id} order={order} />
                ))}
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
