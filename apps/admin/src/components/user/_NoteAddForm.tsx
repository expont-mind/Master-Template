"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface NoteAddFormProps {
  value: string;
  onChange: (s: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
  isPending: boolean;
}

export function NoteAddForm({ value, onChange, onCancel, onSubmit, isPending }: NoteAddFormProps) {
  return (
    <div className="space-y-2 rounded-lg border p-3">
      <Textarea
        placeholder="Тэмдэглэл бичих..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        autoFocus
      />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Болих
        </Button>
        <Button size="sm" onClick={onSubmit} disabled={isPending || !value.trim()}>
          {isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
          Хадгалах
        </Button>
      </div>
    </div>
  );
}
