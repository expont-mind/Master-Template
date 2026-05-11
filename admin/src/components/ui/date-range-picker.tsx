"use client";

import * as React from "react";
import { format } from "date-fns";
import { mn } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  from: Date | undefined;
  to: Date | undefined;
  onChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
  className?: string;
}

export function DateRangePicker({
  from,
  to,
  onChange,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const selected: DateRange | undefined =
    from || to ? { from, to } : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !from && !to && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {from ? (
            to ? (
              <>
                {format(from, "yyyy.MM.dd", { locale: mn })} –{" "}
                {format(to, "yyyy.MM.dd", { locale: mn })}
              </>
            ) : (
              format(from, "yyyy.MM.dd", { locale: mn })
            )
          ) : (
            <span>Огноо сонгох</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={selected}
          onSelect={(range) => {
            onChange({ from: range?.from, to: range?.to });
          }}
          numberOfMonths={1}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
