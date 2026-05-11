"use client";

import * as React from "react";
import { format } from "date-fns";
import { mn } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateTimePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function DateTimePicker({
  value,
  onChange,
  label,
  placeholder = "Огноо сонгох",
  disabled,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);

  const hours = value ? format(value, "HH") : "00";
  const minutes = value ? format(value, "mm") : "00";

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const newDate = new Date(date);
      if (value) {
        newDate.setHours(value.getHours());
        newDate.setMinutes(value.getMinutes());
      }
      onChange(newDate);
    } else {
      onChange(undefined);
    }
  };

  const handleTimeChange = (type: "hours" | "minutes", val: string) => {
    const numVal = parseInt(val, 10);
    if (isNaN(numVal)) return;

    const date = value ? new Date(value) : new Date();
    if (type === "hours") {
      date.setHours(Math.min(23, Math.max(0, numVal)));
    } else {
      date.setMinutes(Math.min(59, Math.max(0, numVal)));
    }
    onChange(date);
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? (
              format(value, "yyyy-MM-dd HH:mm", { locale: mn })
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleDateSelect}
            autoFocus
          />
          <div className="border-t p-3">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Цаг:</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={hours}
                  onChange={(e) => handleTimeChange("hours", e.target.value)}
                  className="w-14 h-8 text-center"
                />
                <span>:</span>
                <Input
                  type="number"
                  min={0}
                  max={59}
                  value={minutes}
                  onChange={(e) => handleTimeChange("minutes", e.target.value)}
                  className="w-14 h-8 text-center"
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
