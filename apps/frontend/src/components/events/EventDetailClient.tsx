"use client";

import Image from "next/image";
import Link from "next/link";

import { Slash } from "@/components/svg";
import { PrimarySm } from "@/components/ui/typography";
import { parseAsUTC } from "@/lib/utils/formatters";

import type { Event } from "@/types/database";

interface EventDetailClientProps {
  event: Event;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "";
  try {
    const date = parseAsUTC(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-CA", { timeZone: "Asia/Ulaanbaatar" });
  } catch {
    return "";
  }
}

function extractYouTubeId(url: string | null): string | null {
  if (!url) return null;
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[7].length === 11 ? match[7] : null;
}

export function EventDetailClient({ event }: EventDetailClientProps) {
  const videoId = extractYouTubeId(event.video_url);

  return (
    <div className="w-full bg-white flex justify-center min-h-screen">
      <div className="flex flex-col gap-4 max-w-[1064px] w-full pb-20 md:pb-[52px] px-4 xl:px-0">
        {/* Breadcrumb */}
        <div className="flex flex-col py-2.5 md:pt-8 md:pb-2">
          <div className="flex items-center gap-1.5 px-1">
            <Link
              href="/events"
              className="text-text-secondary font-normal text-sm font-manrope hover:text-text-primary transition-colors duration-200"
            >
              Эвэнт
            </Link>
            <Slash />
            <PrimarySm>{event.title}</PrimarySm>
          </div>

          {/* Event Title */}
          <h1 className="px-0.5 text-text-primary font-bold text-[26px] leading-9 font-manrope tracking-[-0.26px] hidden md:block">
            {event.title}
          </h1>
        </div>

        <div className="flex flex-col gap-12">
          {/* Main Image */}
          {event.image_url && (
            <div className="relative w-full h-[280px] md:h-[448px] rounded-sm overflow-hidden">
              <Image
                src={event.image_url}
                alt={event.title}
                fill
                className="object-contain object-center bg-border-light"
                sizes="1064px"
                quality={90}
                priority
              />
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-16 lg:gap-[106px]">
            {/* Left Column - Event Info */}
            <div className="w-full lg:w-[254px] lg:shrink-0 flex flex-col gap-6">
              {/* Location */}
              {event.location && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-text-secondary font-medium text-base font-manrope">
                    Хаана
                  </span>
                  <span className="text-text-primary font-semibold text-base font-manrope">
                    {event.location}
                  </span>
                </div>
              )}

              {/* Start Date */}
              {event.start_date && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-text-secondary font-medium text-base font-manrope">
                    Эхлэх огноо
                  </span>
                  <span className="text-text-primary font-semibold text-base font-manrope">
                    {formatDate(event.start_date)}
                  </span>
                </div>
              )}

              {/* End Date */}
              {event.end_date && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-text-secondary font-medium text-base font-manrope">
                    Дуусах огноо
                  </span>
                  <span className="text-text-primary font-semibold text-base font-manrope">
                    {formatDate(event.end_date)}
                  </span>
                </div>
              )}
            </div>

            {/* Right Column - Description & Video */}
            <div className="flex-1 flex flex-col gap-9">
              {/* Description Section */}
              {event.description && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-text-secondary font-medium text-base font-manrope">
                    Дэлгэрэнгүй
                  </span>
                  <span className="text-text-primary font-medium text-base font-manrope">
                    {event.description}
                  </span>
                </div>
              )}

              {/* YouTube Video */}
              {videoId && (
                <div className="w-full aspect-video rounded-sm overflow-hidden">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title={event.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
