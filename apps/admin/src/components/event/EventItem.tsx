"use client";

import { CalendarDays, Eye, Pencil, MoreHorizontal, Trash2, MapPin, Clock } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CONTENT_STATUS_LABELS, CONTENT_STATUS_COLORS } from "@/constants";

import { getEventTimeStatus, formatDateTime, type Event } from "./types";

interface EventItemProps {
  event: Event;
  onDelete: () => void;
}

export function EventItem({ event, onDelete }: EventItemProps) {
  const timeStatus = getEventTimeStatus(event);

  return (
    <div className="flex items-start gap-4 py-4">
      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <CalendarDays className="h-6 w-6 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <Link href={`/events/${event.id}`} className="font-medium hover:underline">
            {event.title}
          </Link>
          <Badge variant="secondary" className={CONTENT_STATUS_COLORS[event.status]}>
            {CONTENT_STATUS_LABELS[event.status]}
          </Badge>
          {timeStatus && (
            <Badge variant="secondary" className={timeStatus.color}>
              {timeStatus.label}
            </Badge>
          )}
        </div>
        {event.description && (
          <p className="text-sm text-muted-foreground line-clamp-1 mb-1">{event.description}</p>
        )}
        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
          {event.start_date && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDateTime(event.start_date)}
              {event.end_date && ` - ${formatDateTime(event.end_date)}`}
            </span>
          )}
          {event.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {event.location}
            </span>
          )}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/events/${event.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              Харах
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/events/${event.id}`}>
              <Pencil className="mr-2 h-4 w-4" />
              Засах
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={onDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Устгах
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
