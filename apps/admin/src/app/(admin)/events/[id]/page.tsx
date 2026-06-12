"use client";

import { use } from "react";

import { EventForm } from "@/components/event";

export default function EventEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <EventForm id={id} />;
}
