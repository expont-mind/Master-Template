"use client";

import { useQuery } from "@tanstack/react-query";

import { SectionTitle } from "@/components/home/SectionTitle";
import { ChevronRight } from "@/components/svg";
import { MutedText } from "@/components/ui/typography";
import { eventKeys, getEvents } from "@/lib/queries/events";

import { EventCard } from "./EventCard";

const EVENTS_GRID_SKELETON_IDS = ["e1", "e2", "e3", "e4", "e5", "e6"] as const;
const EVENTS_ROW_SKELETON_IDS = ["e1", "e2", "e3"] as const;

function EventCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 min-w-[280px] sm:min-w-[320px] md:min-w-0 md:flex-1">
      <div className="w-full aspect-3/2 skeleton rounded-lg" />
      <div className="flex flex-col gap-1.5">
        <div className="h-6 skeleton" />
        <div className="h-4 w-24 skeleton" />
      </div>
    </div>
  );
}

export function EventsClient() {
  const { data: events, isLoading } = useQuery({
    queryKey: eventKeys.list(),
    queryFn: getEvents,
  });

  return (
    <div className="w-full bg-white flex justify-center">
      <div className="flex flex-col items-center max-w-[1064px] w-full pb-[52px] px-4 xl:px-0 gap-2 md:gap-7">
        <div className="pb-2 pt-4 md:pt-[52px] flex items-center gap-0.5 w-full">
          <p className="px-0.5 text-text-primary font-bold text-xl md:text-[26px] leading-9 font-manrope">
            Эвэнт
          </p>
          <ChevronRight />
        </div>

        <div className="flex flex-col gap-4 w-full">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {EVENTS_GRID_SKELETON_IDS.map((id) => (
                <EventCardSkeleton key={id} />
              ))}
            </div>
          ) : events && events.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <MutedText>Эвэнт олдсонгүй</MutedText>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface EventsSectionProps {
  iconSrc?: string;
}

export function EventsSection({ iconSrc }: EventsSectionProps) {
  const { data: events, isLoading } = useQuery({
    queryKey: eventKeys.list(),
    queryFn: getEvents,
  });

  if (isLoading) {
    return (
      <div className="w-full bg-white flex justify-center">
        <div className="pt-10 sm:pt-12 md:pt-16 pb-10 flex flex-col gap-4 sm:gap-5 md:gap-7 max-w-[1064px] w-full">
          <div className="px-4 md:px-0">
            <SectionTitle title="Эвэнт" iconSrc={iconSrc} href="/events" />
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pl-4 md:pl-0">
            {EVENTS_ROW_SKELETON_IDS.map((id) => (
              <EventCardSkeleton key={id} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-white flex justify-center">
      <div className="pt-10 sm:pt-12 md:pt-16 pb-10 flex flex-col gap-4 sm:gap-5 md:gap-7 max-w-[1064px] w-full">
        <div className="px-4 md:px-0">
          <SectionTitle title="Эвэнт" iconSrc={iconSrc} href="/events" />
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pl-4 md:pl-0">
          {events.slice(0, 3).map((event, index) => (
            <div
              key={event.id}
              className={index === events.slice(0, 3).length - 1 ? "pr-4 md:pr-0" : ""}
            >
              <EventCard event={event} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
