"use client";

import Image from "next/image";
import Link from "next/link";

import { Calendar } from "@/components/svg";
import { parseAsUTC } from "@/lib/utils/formatters";

import type { Event } from "@/types/database";

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return "";
    try {
      const date = parseAsUTC(dateString);
      if (isNaN(date.getTime())) return "";
      return date.toLocaleDateString("en-CA", { timeZone: "Asia/Ulaanbaatar" });
    } catch {
      return "";
    }
  };

  // Use created_at as fallback if event_date isn't set
  const displayDate = event.event_date || event.created_at;

  return (
    <Link href={`/events/${event.slug}`} className="flex flex-col gap-2 md:min-w-0 md:flex-1">
      <div className="relative w-full aspect-3/2 bg-surface rounded-sm overflow-hidden h-[260px]">
        {event.image_url ? (
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 280px, 320px"
            quality={90}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="6" y="10" width="36" height="28" rx="2" stroke="#CBD5E1" strokeWidth="1.5" />
              <circle cx="16" cy="20" r="3" stroke="#CBD5E1" strokeWidth="1.5" />
              <path
                d="M6 32L16 24L26 32L36 22L42 28"
                stroke="#CBD5E1"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-text-muted text-sm font-manrope">3:2</span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 py-0.5">
        <p className="text-text-primary font-medium md:font-bold text-base sm:text-lg font-manrope leading-6 line-clamp-2">
          {event.title}
        </p>
        {displayDate && (
          <div className="flex items-center gap-1.5">
            <Calendar />
            <span className="text-text-secondary font-medium text-sm font-manrope">
              {formatDate(displayDate)}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
