import { cache } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EventDetailClient } from "@/components/events/EventDetailClient";
import { BreadcrumbSchema } from "@/components/seo/JsonLd";
import { getCachedOrFetch, cacheKeys } from "@/lib/redis/client";
import type { Event } from "@/types/database";

export const revalidate = 300;

interface EventPageProps {
  params: Promise<{ slug: string }>;
}

// Shared fetcher: was previously called twice (generateMetadata + page).
// React.cache dedupes within a request; Upstash dedupes across requests
// for 30 minutes.
const getEvent = cache(async (slug: string): Promise<Event | null> =>
  getCachedOrFetch<Event | null>(
    cacheKeys.eventDetail(slug),
    async () => {
      const supabase = await createClient();
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("slug", slug)
        .single();
      return (data as Event | null) ?? null;
    },
    1800,
  ),
);

export async function generateMetadata({
  params,
}: EventPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);

  if (!event) {
    return {
      title: "Эвэнт олдсонгүй",
    };
  }

  return {
    title: event.title,
    description: event.description || `${event.title} - Monpang эвэнт`,
    alternates: {
      canonical: `/events/${slug}`,
    },
    openGraph: {
      title: `${event.title} | Monpang`,
      description: event.description || `${event.title} - Monpang эвэнт`,
      url: `https://monpang.com/events/${slug}`,
      type: "website",
      images: event.image_url ? [{ url: event.image_url }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${event.title} | Monpang`,
      description: event.description || `${event.title} - Monpang эвэнт`,
      images: event.image_url ? [event.image_url] : undefined,
    },
  };
}

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params;
  const event = await getEvent(slug);

  if (!event) {
    console.error("[Event] Not found:", slug);
    notFound();
  }

  const breadcrumbItems = [
    { name: "Нүүр", url: "/" },
    { name: "Эвэнт", url: "/events" },
    { name: event.title, url: `/events/${slug}` },
  ];

  return (
    <>
      <BreadcrumbSchema items={breadcrumbItems} />
      <EventDetailClient event={event} />
    </>
  );
}
