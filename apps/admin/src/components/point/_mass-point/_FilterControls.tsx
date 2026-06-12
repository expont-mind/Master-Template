"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  POINT_FILTER_LABEL,
  STATUS_FILTER_LABEL,
  type PointFilter,
  type StatusFilter,
} from "./_types";

interface FilterControlsProps {
  pointFilter: PointFilter;
  statusFilter: StatusFilter;
  onChangePointFilter: (filter: PointFilter) => void;
  onChangeStatusFilter: (filter: StatusFilter) => void;
}

export function FilterControls({
  pointFilter,
  statusFilter,
  onChangePointFilter,
  onChangeStatusFilter,
}: FilterControlsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-2">
        <Label>Point төлөв</Label>
        <Select value={pointFilter} onValueChange={(v) => onChangePointFilter(v as PointFilter)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(POINT_FILTER_LABEL).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Хэрэглэгчийн төлөв</Label>
        <Select value={statusFilter} onValueChange={(v) => onChangeStatusFilter(v as StatusFilter)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(STATUS_FILTER_LABEL).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
