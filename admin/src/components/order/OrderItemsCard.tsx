"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Image as ImageIcon, Copy, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { OrderItem } from "./types";

interface WarehouseOption {
  id: string;
  name: string;
  name_color: string | null;
}

interface OrderItemsCardProps {
  items: OrderItem[];
  totalAmount: number;
  warehouses?: WarehouseOption[];
  onAllocate?: (
    itemId: string,
    warehouseId: string | null,
    isReturned: boolean,
  ) => void;
  allocatingItemId?: string | null;
}

export function OrderItemsCard({
  items,
  totalAmount,
  warehouses = [],
  onAllocate,
  allocatingItemId,
}: OrderItemsCardProps) {
  const router = useRouter();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(name);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleAllocationChange = (itemId: string, value: string) => {
    if (!onAllocate) return;
    if (value === "returned") {
      onAllocate(itemId, null, true);
    } else if (value === "unselected") {
      onAllocate(itemId, null, false);
    } else {
      onAllocate(itemId, value, false);
    }
  };

  const getSelectValue = (item: OrderItem): string => {
    if (item.is_returned) return "returned";
    if (item.warehouse_id) return item.warehouse_id;
    return "unselected";
  };

  return (
    <Card className="md:col-span-2 pt-0 overflow-hidden">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              <TableHead className="w-[250px] font-medium text-foreground">
                Бүтээгдэхүүн
              </TableHead>
              <TableHead className="w-[160px] font-medium text-foreground">
                Бараа хуваарилалт
              </TableHead>
              <TableHead className="w-[80px] text-left font-medium text-foreground">
                Тоо ширхэг
              </TableHead>
              <TableHead className="w-[80px] font-medium text-foreground text-left">
                Үнэ
              </TableHead>
              <TableHead className="w-[40px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...items]
              .sort((a, b) => a.id.localeCompare(b.id))
              .map((item) => {
                const primaryImage = item.products?.product_images?.find(
                  (img) => img.is_primary,
                );
                const selectedValue = getSelectValue(item);
                const selectedWarehouse = warehouses.find(
                  (w) => w.id === item.warehouse_id,
                );

                return (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/products/${item.product_id}`)}
                  >
                    <TableCell className="p-2">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                          {primaryImage ? (
                            <img
                              src={primaryImage.url}
                              alt={item.products?.name || ""}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {item.products?.name || "Устгагдсан бараа"}
                          </div>
                          {item.variant_name && (
                            <div className="text-sm text-muted-foreground truncate">
                              {item.variant_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell
                      className="p-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {allocatingItemId === item.id ? (
                        <div className="h-8 w-[150px] flex items-center justify-center">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <Select
                          value={selectedValue}
                          onValueChange={(v) =>
                            handleAllocationChange(item.id, v)
                          }
                          disabled={!!allocatingItemId}
                        >
                          <SelectTrigger className="h-8 w-[150px] text-xs">
                            <SelectValue>
                              {item.is_returned ? (
                                <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800">
                                  Буцаасан
                                </span>
                              ) : selectedWarehouse ? (
                                <span
                                  className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium text-white"
                                  style={{
                                    backgroundColor:
                                      selectedWarehouse.name_color || "#6b7280",
                                  }}
                                >
                                  {selectedWarehouse.name}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">
                                  Сонгох
                                </span>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unselected">
                              <span className="text-muted-foreground">
                                Сонгох
                              </span>
                            </SelectItem>
                            {warehouses.map((wh) => (
                              <SelectItem key={wh.id} value={wh.id}>
                                <div className="flex items-center gap-2">
                                  <span
                                    className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium text-white"
                                    style={{
                                      backgroundColor:
                                        wh.name_color || "#6b7280",
                                    }}
                                  >
                                    {wh.name}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                            <SelectItem value="returned">
                              <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800">
                                Буцаасан
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell className="p-2">
                      <span className="text-sm">{item.quantity}</span>
                    </TableCell>
                    <TableCell className="p-2">
                      <span className="text-sm">
                        {(item.price * item.quantity).toLocaleString()}₮
                      </span>
                    </TableCell>
                    <TableCell className="p-2">
                      <button
                        onClick={(e) =>
                          handleCopy(e, item.id, item.products?.name || "")
                        }
                        className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title="Нэр хуулах"
                      >
                        {copiedId === item.id ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            <TableRow className="border-b py-1">
              <TableCell className="px-4 py-2 font-semibold text-sm">
                Нийт дүн
              </TableCell>
              <TableCell className="p-2"></TableCell>
              <TableCell className="p-2 font-semibold text-sm text-left">
                {items.reduce((sum, item) => sum + item.quantity, 0)} ш
              </TableCell>
              <TableCell className="p-2 font-semibold text-sm">
                {totalAmount.toLocaleString()}₮
              </TableCell>
              <TableCell className="p-2" />
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
