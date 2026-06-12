"use client";

import { Image as ImageIcon, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { parseAsUTC } from "@/lib/utils/formatters";

// Image cell with fallback
export function ImageCell({ src, alt }: { src?: string | null; alt?: string }) {
  return (
    <div className="h-14 w-14 rounded-sm bg-muted flex items-center justify-center overflow-hidden relative">
      {src ? (
        <Image src={src} alt={alt ?? ""} fill sizes="56px" className="object-cover" />
      ) : (
        <ImageIcon className="h-5 w-5 text-muted-foreground" />
      )}
    </div>
  );
}

// Badge cell with configurable color map
export function BadgeCell({
  value,
  labels,
  colors,
}: {
  value: string;
  labels: Record<string, string>;
  colors: Record<string, string>;
}) {
  return (
    <Badge variant="secondary" className={colors[value]}>
      {labels[value] ?? value}
    </Badge>
  );
}

// Formatted date display
export function DateCell({ value, showTime }: { value: string; showTime?: boolean }) {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Ulaanbaatar",
    ...(showTime && { hour: "2-digit", minute: "2-digit" }),
  };
  return (
    <span className="text-muted-foreground">
      {parseAsUTC(value).toLocaleDateString("mn-MN", options)}
    </span>
  );
}

// Currency formatting with ₮
export function PriceCell({ value, suffix }: { value: number; suffix?: string }) {
  return (
    <span className="font-medium">
      ₮{value.toLocaleString()}
      {suffix && <span className="text-muted-foreground text-xs ml-1">{suffix}</span>}
    </span>
  );
}

// Edit/Delete action buttons
export function ActionsCell({ editHref, onDelete }: { editHref?: string; onDelete?: () => void }) {
  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- wrapper only stops propagation; inner buttons are keyboard-accessible
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      {editHref && (
        <Link href={editHref}>
          <Button variant="ghost" size="icon-sm">
            <Pencil className="h-4 w-4" />
          </Button>
        </Link>
      )}
      {onDelete && (
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
