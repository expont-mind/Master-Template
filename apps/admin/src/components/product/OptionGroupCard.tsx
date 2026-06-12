"use client";

import { Trash2, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { OPTION_TYPES } from "./types";

import type { OptionGroup } from "./types";

interface OptionGroupCardProps {
  group: OptionGroup;
  index: number;
  onRemove: () => void;
  onTypeChange: (type: string) => void;
  onRequiredChange: (isRequired: boolean) => void;
  onAddValue: (value: string) => void;
  onRemoveValue: (value: string) => void;
  newValueInput: string;
  onNewValueInputChange: (value: string) => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  usedTypes: string[];
  customTypes: string[];
  onAddCustomType: (type: string) => void;
}

export function OptionGroupCard({
  group,
  index,
  onRemove,
  onTypeChange,
  onRequiredChange,
  onAddValue,
  onRemoveValue,
  newValueInput,
  onNewValueInputChange,
  onKeyPress,
  usedTypes,
  customTypes,
  onAddCustomType,
}: OptionGroupCardProps) {
  return (
    <div className="space-y-3">
      <OptionGroupHeader
        index={index}
        isRequired={group.is_required ?? true}
        onRemove={onRemove}
        onRequiredChange={onRequiredChange}
      />
      <div className="flex gap-3">
        <OptionGroupTypeSelector
          group={group}
          usedTypes={usedTypes}
          customTypes={customTypes}
          onTypeChange={onTypeChange}
          onAddCustomType={onAddCustomType}
        />
        <OptionGroupValueTags
          values={group.values}
          newValueInput={newValueInput}
          onNewValueInputChange={onNewValueInputChange}
          onAddValue={onAddValue}
          onRemoveValue={onRemoveValue}
          onKeyPress={onKeyPress}
        />
      </div>
    </div>
  );
}

function OptionGroupHeader({
  index,
  isRequired,
  onRemove,
  onRequiredChange,
}: {
  index: number;
  isRequired: boolean;
  onRemove: () => void;
  onRequiredChange: (isRequired: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Сонголт {index + 1}</span>
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <button
            type="button"
            role="switch"
            aria-checked={isRequired}
            onClick={() => onRequiredChange(!isRequired)}
            className={cn(
              "relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
              isRequired ? "bg-primary" : "bg-muted",
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out",
                isRequired ? "translate-x-4" : "translate-x-0",
              )}
            />
          </button>
          <span
            className={cn(
              "text-xs font-medium",
              isRequired ? "text-primary" : "text-muted-foreground",
            )}
          >
            {isRequired ? "Заавал" : "Заавал биш"}
          </span>
        </label>
      </div>
      <Button type="button" variant="destructive" size="sm" onClick={onRemove} className="h-8">
        <Trash2 className="h-3.5 w-3.5 mr-1" />
        Устгах
      </Button>
    </div>
  );
}

function OptionGroupTypeSelector({
  group,
  usedTypes,
  customTypes,
  onTypeChange,
  onAddCustomType,
}: {
  group: OptionGroup;
  usedTypes: string[];
  customTypes: string[];
  onTypeChange: (type: string) => void;
  onAddCustomType: (type: string) => void;
}) {
  const [isCustomInput, setIsCustomInput] = useState(false);
  const [customTypeName, setCustomTypeName] = useState("");

  const allTypes = [
    ...OPTION_TYPES,
    ...customTypes.filter((t) => !(OPTION_TYPES as readonly string[]).includes(t)),
  ];
  const isCustomType = group.type && !allTypes.includes(group.type);

  const handleSelectChange = (value: string) => {
    if (value === "__custom__") {
      setIsCustomInput(true);
      setCustomTypeName("");
      return;
    }
    onTypeChange(value);
  };

  const handleCustomSubmit = () => {
    const trimmed = customTypeName.trim();
    if (trimmed) {
      onTypeChange(trimmed);
      onAddCustomType(trimmed);
    }
    setIsCustomInput(false);
    setCustomTypeName("");
  };

  const handleCustomKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCustomSubmit();
    } else if (e.key === "Escape") {
      setIsCustomInput(false);
      setCustomTypeName("");
    }
  };

  return (
    <div className="w-[200px] h-10">
      {isCustomInput ? (
        <Input
          autoFocus
          placeholder="Нэр бичих..."
          value={customTypeName}
          onChange={(e) => setCustomTypeName(e.target.value)}
          onKeyDown={handleCustomKeyDown}
          onBlur={handleCustomSubmit}
          className="h-10"
        />
      ) : (
        <Select value={group.type} onValueChange={handleSelectChange}>
          <SelectTrigger className="w-full min-h-10">
            <SelectValue placeholder="Сонгох" />
          </SelectTrigger>
          <SelectContent>
            {allTypes.map((type) => (
              <SelectItem key={type} value={type} disabled={usedTypes.includes(type)}>
                {type}
              </SelectItem>
            ))}
            {isCustomType && (
              <SelectItem key={group.type} value={group.type}>
                {group.type}
              </SelectItem>
            )}
            <SelectItem value="__custom__" className="text-primary font-medium">
              + Шинээр нэмэх...
            </SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

function OptionGroupValueTags({
  values,
  newValueInput,
  onNewValueInputChange,
  onAddValue,
  onRemoveValue,
  onKeyPress,
}: {
  values: string[];
  newValueInput: string;
  onNewValueInputChange: (value: string) => void;
  onAddValue: (value: string) => void;
  onRemoveValue: (value: string) => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex-1 flex items-center gap-2 flex-wrap border rounded-md px-3 h-10">
      {values.map((value) => (
        <span
          key={value}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary text-primary-foreground rounded-md text-sm"
        >
          {value}
          <button
            type="button"
            onClick={() => onRemoveValue(value)}
            className="hover:bg-primary-foreground/20 rounded p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        placeholder="Сонголтууд"
        value={newValueInput}
        onChange={(e) => onNewValueInputChange(e.target.value)}
        onKeyDown={onKeyPress}
        onBlur={() => onAddValue(newValueInput)}
        className="flex-1 min-w-[80px] outline-none bg-transparent text-sm"
      />
    </div>
  );
}
