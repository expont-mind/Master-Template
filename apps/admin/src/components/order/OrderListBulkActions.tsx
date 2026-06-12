"use client";

import { Download, Loader2, Package, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

interface OrderListBulkActionsProps {
  selectedCount: number;
  isBoxPrintLoading: boolean;
  isStickerLoading: boolean;
  isExporting: boolean;
  onBoxPrint: () => void;
  onStickerPrint: () => void;
  onDownload: () => void;
}

export function OrderListBulkActions({
  selectedCount,
  isBoxPrintLoading,
  isStickerLoading,
  isExporting,
  onBoxPrint,
  onStickerPrint,
  onDownload,
}: OrderListBulkActionsProps) {
  const disabled = selectedCount === 0;
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onBoxPrint}
        disabled={disabled || isBoxPrintLoading}
      >
        {isBoxPrintLoading ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <Package className="h-4 w-4 mr-1" />
        )}
        Бараа{selectedCount > 0 && ` (${selectedCount})`}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onStickerPrint}
        disabled={disabled || isStickerLoading}
      >
        {isStickerLoading ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <Printer className="h-4 w-4 mr-1" />
        )}
        Хайрцаг{selectedCount > 0 && ` (${selectedCount})`}
      </Button>
      <Button variant="outline" size="sm" onClick={onDownload} disabled={disabled || isExporting}>
        {isExporting ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <Download className="h-4 w-4 mr-1" />
        )}
        Татах{selectedCount > 0 && ` (${selectedCount})`}
      </Button>
    </div>
  );
}
