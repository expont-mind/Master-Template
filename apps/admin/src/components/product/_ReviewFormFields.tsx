"use client";

// Shared form fields for the Add/Edit review dialogs in ProductReviewsTab.

import { format } from "date-fns";
import { mn } from "date-fns/locale";
import { CalendarIcon, Star } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { MultiImageUpload } from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

export function DatePicker({ value, onChange }: { value: Date; onChange: (date: Date) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-left font-normal">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {format(value, "yyyy.MM.dd", { locale: mn })}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            if (date) {
              const normalized = new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate(),
                12,
                0,
                0,
              );
              onChange(normalized);
              setOpen(false);
            }
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export function StarRatingInput({
  rating,
  hoverRating,
  onRatingChange,
  onHoverChange,
}: {
  rating: number;
  hoverRating: number;
  onRatingChange: (r: number) => void;
  onHoverChange: (r: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange(star)}
          onMouseEnter={() => onHoverChange(star)}
          onMouseLeave={() => onHoverChange(0)}
          className="p-0.5"
        >
          <Star
            className={`h-7 w-7 transition-colors ${
              star <= (hoverRating || rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

interface ReviewFormFieldsProps {
  name: string;
  setName: (v: string) => void;
  date: Date;
  setDate: (d: Date) => void;
  rating: number;
  setRating: (r: number) => void;
  hoverRating: number;
  setHoverRating: (r: number) => void;
  comment: string;
  setComment: (v: string) => void;
  images: string[];
  setImages: (imgs: string[]) => void;
  error: string | null;
}

export function ReviewFormFields({
  name,
  setName,
  date,
  setDate,
  rating,
  setRating,
  hoverRating,
  setHoverRating,
  comment,
  setComment,
  images,
  setImages,
  error,
}: ReviewFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="review-name" className="text-sm font-medium mb-1.5 block">
            Нэр <span className="text-destructive">*</span>
          </label>
          <Input
            id="review-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Хэрэглэгчийн нэр"
          />
        </div>
        <div>
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <label className="text-sm font-medium mb-1.5 block">Огноо</label>
          <DatePicker value={date} onChange={setDate} />
        </div>
      </div>
      <div>
        {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
        <label className="text-sm font-medium mb-1.5 block">
          Үнэлгээ <span className="text-destructive">*</span>
        </label>
        <StarRatingInput
          rating={rating}
          hoverRating={hoverRating}
          onRatingChange={setRating}
          onHoverChange={setHoverRating}
        />
      </div>
      <div>
        <label htmlFor="review-comment" className="text-sm font-medium mb-1.5 block">
          Сэтгэгдэл
        </label>
        <Textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Сэтгэгдэл бичих..."
          rows={3}
        />
      </div>
      <div>
        {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
        <label className="text-sm font-medium mb-1.5 block">Зураг</label>
        <MultiImageUpload values={images} onChange={setImages} maxImages={3} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
