"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useEventEdit } from "@/hooks/useEventEdit";

import { EventEditHeader } from "./EventEditHeader";
import { EventImageUploadCard } from "./EventImageUploadCard";
import { EventInfoCard } from "./EventInfoCard";
import { EventMainCard } from "./EventMainCard";
import { EventSettingsCard } from "./EventSettingsCard";

interface EventFormProps {
  id: string;
}

export function EventForm({ id }: EventFormProps) {
  const {
    isNew,
    event,
    isLoading,
    isSaving,
    error,
    title,
    description,
    location,
    startDate,
    endDate,
    imageUrl,
    videoUrl,
    status,
    setTitle,
    setDescription,
    setLocation,
    setStartDate,
    setEndDate,
    setImageUrl,
    setVideoUrl,
    setStatus,
    handleSave,
    handlePublish,
  } = useEventEdit(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isNew && !event) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h3 className="text-lg font-medium">Эвент олдсонгүй</h3>
        <Link href="/events">
          <Button variant="link">Буцах</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EventEditHeader
        isNew={isNew}
        status={status}
        title={title}
        isSaving={isSaving}
        onSave={handleSave}
        onPublish={handlePublish}
      />

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-sm">{error}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Main content */}
        <div className="space-y-6">
          <EventMainCard
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            location={location}
            setLocation={setLocation}
            videoUrl={videoUrl}
            setVideoUrl={setVideoUrl}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <EventSettingsCard status={status} onStatusChange={setStatus} />
          <EventImageUploadCard imageUrl={imageUrl} setImageUrl={setImageUrl} disabled={isSaving} />
          {!isNew && event && <EventInfoCard event={event} />}
        </div>
      </div>
    </div>
  );
}
