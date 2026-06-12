import type { ContentStatus } from "@/types/database";

export interface Event {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  image_url?: string | null;
  video_url?: string | null;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
}

export interface EventTimeStatus {
  label: string;
  color: string;
}

export function getEventTimeStatus(event: Event): EventTimeStatus | null {
  if (!event.start_date) return null;

  const now = new Date();
  const start = new Date(event.start_date);
  const end = event.end_date ? new Date(event.end_date) : null;

  if (now < start) {
    return { label: "Удахгүй", color: "bg-blue-100 text-blue-800" };
  } else if (end && now > end) {
    return { label: "Дууссан", color: "bg-gray-100 text-gray-800" };
  } else {
    return { label: "Явагдаж байна", color: "bg-green-100 text-green-800" };
  }
}

export function formatDateTime(dateString: string | null): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("mn-MN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ulaanbaatar",
  });
}

export function formatDateTimeForInput(dateString: string): string {
  const date = new Date(dateString);
  return date.toISOString().slice(0, 16);
}
