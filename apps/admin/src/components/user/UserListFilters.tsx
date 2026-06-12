"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { USER_SORT_LABELS } from "@/constants";

interface UserListFiltersProps {
  sortOption: string;
  setSortOption: (v: string) => void;
}

export function UserListFilters({ sortOption, setSortOption }: UserListFiltersProps) {
  return (
    <Select value={sortOption} onValueChange={setSortOption}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Эрэмбэлэх" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(USER_SORT_LABELS).map(([key, label]) => (
          <SelectItem key={key} value={key}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
