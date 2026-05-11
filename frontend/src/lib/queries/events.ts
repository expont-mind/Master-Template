import { createClient } from "@/lib/supabase/client";
import { log } from "@/lib/utils/logger";
import type { Event } from "@/types/database";

export const eventKeys = {
  all: ["events"] as const,
  list: () => [...eventKeys.all, "list"] as const,
  detail: (slug: string) => [...eventKeys.all, "detail", slug] as const,
};

// Explicit column list — must match the production `events` schema.
// `event_date` was previously listed but has never existed on the
// live table (schema only has start_date / end_date / created_at /
// updated_at); including it produced a 400 that emptied the
// /events page. EventCard.tsx already falls back to created_at.
const EVENT_COLUMNS =
  "id, title, slug, description, image_url, start_date, end_date, location, video_url, created_at, updated_at";

export async function getEvents(): Promise<Event[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    log.error("events_fetch_failed", { message: error.message });
    return [];
  }

  return data ?? [];
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .eq("slug", slug)
    .single();

  if (error) {
    log.error("event_fetch_failed", { message: error.message });
    return null;
  }

  return data;
}
