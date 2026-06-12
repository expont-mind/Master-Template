"use client";

import { format } from "date-fns";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DataTableToolbar } from "@/components/ui/data-table";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/constants";

interface OrderListToolbarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  resultCount: number;
  paymentFilter: string;
  setPaymentFilter: (v: string) => void;
  paymentStatusFilter: string;
  setPaymentStatusFilter: (v: string) => void;
  sortOption: string;
  setSortOption: (v: string) => void;
  dateFrom: string;
  dateTo: string;
  setDateRange: (from: string, to: string) => void;
}

export function OrderListToolbar(props: OrderListToolbarProps) {
  return (
    <DataTableToolbar
      searchValue={props.searchQuery}
      onSearchChange={props.setSearchQuery}
      searchPlaceholder="Хайх"
      resultCount={props.resultCount}
      resultLabel="захиалга"
    >
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Төрөл:</span>
        <Select value={props.paymentFilter} onValueChange={props.setPaymentFilter}>
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Бүгд" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Бүгд</SelectItem>
            {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Төлбөр:</span>
        <Select value={props.paymentStatusFilter} onValueChange={props.setPaymentStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Бүгд</SelectItem>
            {Object.entries(PAYMENT_STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Эрэмбэ:</span>
        <Select value={props.sortOption} onValueChange={props.setSortOption}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_desc">Огноо ↓</SelectItem>
            <SelectItem value="date_asc">Огноо ↑</SelectItem>
            <SelectItem value="amount_desc">Дүн ↓</SelectItem>
            <SelectItem value="amount_asc">Дүн ↑</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Огноо:</span>
        <div className="flex items-center gap-1">
          <DateRangePicker
            from={props.dateFrom ? new Date(props.dateFrom) : undefined}
            to={props.dateTo ? new Date(props.dateTo) : undefined}
            onChange={({ from, to }) => {
              props.setDateRange(
                from ? format(from, "yyyy-MM-dd") : "",
                to ? format(to, "yyyy-MM-dd") : "",
              );
            }}
            className="w-[280px]"
          />
          {(props.dateFrom || props.dateTo) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => props.setDateRange("", "")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </DataTableToolbar>
  );
}
