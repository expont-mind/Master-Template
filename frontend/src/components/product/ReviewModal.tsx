"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useScrollLock } from "@/lib/hooks/useScrollLock";
import Image from "next/image";
import { Cancel, ImagePlus } from "../svg";
import { X } from "lucide-react";
import { PrimaryHeading } from "@/components/ui/typography";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSkip: () => void;
  onSubmitWithComment: (comment: string, images: File[]) => void;
}

export const ReviewModal = ({
  isOpen,
  onClose,
  onSkip,
  onSubmitWithComment,
}: ReviewModalProps) => {
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useScrollLock(visible);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimate(true);
        });
      });
    } else {
      setAnimate(false);
      const timeout = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (visible) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [visible, onClose]);

  const handleClose = () => {
    setComment("");
    setImages([]);
    setPreviews([]);
    onClose();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files).slice(0, 3 - images.length);
    setImages((prev) => [...prev, ...newFiles]);

    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitWithComment = () => {
    onSubmitWithComment(comment, images);
    setComment("");
    setImages([]);
    setPreviews([]);
  };

  if (!visible || typeof window === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-999 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-[rgba(2,6,23,0.30)] transition-opacity duration-200"
        style={{ opacity: animate ? 1 : 0 }}
        onClick={() => {
          setComment("");
          setImages([]);
          setPreviews([]);
          onSkip();
        }}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-[544px] bg-white rounded-[10px] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.10),0_4px_6px_-4px_rgba(0,0,0,0.10)] p-6 flex flex-col gap-6 transition-all duration-200"
        style={{
          opacity: animate ? 1 : 0,
          transform: animate ? "scale(1)" : "scale(0.95)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <PrimaryHeading>
            Сэтгэгдэл бичих
          </PrimaryHeading>
          <button
            onClick={() => {
              setComment("");
              setImages([]);
              setPreviews([]);
              onSkip();
            }}
            className="p-1 cursor-pointer"
            aria-label="Close"
          >
            <Cancel />
          </button>
        </div>

        {/* Image Upload */}
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            {previews.map((preview, index) => (
              <div
                key={index}
                className="relative w-[106px] h-[106px] rounded-md border-[1.5px] border-[#E2E8F0] overflow-hidden"
              >
                <Image
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  fill
                  sizes="106px"
                  quality={75}
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1 right-1 w-5 h-5 bg-[rgba(2,6,23,0.50)] rounded-full flex items-center justify-center cursor-pointer"
                >
                  <X size={12} color="#fff" />
                </button>
              </div>
            ))}
            {images.length < 3 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-[106px] h-[106px] border-[1.5px] border-dashed bg-[#F8FAFC] border-[#E2E8F0] rounded-md flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-[#020617] transition-colors"
              >
                <ImagePlus />
                <span className="text-[#64748B] font-medium text-sm font-manrope">
                  Зураг
                </span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>

          {/* Comment Textarea */}
          <textarea
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            placeholder="Сэтгэгдэл бичих"
            className="w-full min-h-[120px] px-3 py-2 border border-[#E2E8F0] rounded-sm text-[#020617] font-normal text-base font-manrope placeholder:text-[#64748B] resize-none focus:outline-none focus:border-[#020617] transition-colors duration-200"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setComment("");
              setImages([]);
              setPreviews([]);
              onSkip();
            }}
            className="flex w-full items-center justify-center px-3 py-2.5 h-11 border border-[#E2E8F0] rounded-sm cursor-pointer text-[#020617] font-normal text-base font-manrope hover:bg-[#F8FAFC] transition-colors duration-200"
          >
            Алгасах
          </button>
          <button
            onClick={handleSubmitWithComment}
            disabled={!comment.trim()}
            className="flex w-full items-center justify-center px-3 py-2.5 h-11 bg-[#020617] rounded-sm cursor-pointer text-white font-normal text-base font-manrope hover:bg-[#1E293B] transition-colors duration-200 disabled:bg-[rgba(2,6,23,0.30)] disabled:cursor-not-allowed"
          >
            <span className="hidden md:inline">Сэтгэгдэл оруулах</span>
            <span className="md:hidden">Оруулах</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
