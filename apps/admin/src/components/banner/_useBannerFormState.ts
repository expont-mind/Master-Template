"use client";

// State + handlers extracted from BannerForm. Wraps useBannerEdit with
// the local UI state (loading states, popovers, link type sync, file
// upload, color picker handlers, image canvas loading).

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { useBannerEdit } from "@/hooks/useBannerEdit";
import { compressImage } from "@/lib/image-compression";
import { log } from "@/lib/observability/log";

export type LinkType = "none" | "category" | "product" | "link";
export type FileLoadingState = "compressing" | "uploading" | null;

async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("files", file);

  const res = await fetch("/api/admin/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Upload failed");
  }

  const data = await res.json();
  return data.urls[0];
}

// Loads an image to the canvas (for later color picking). No-ops when
// either the URL or the canvas ref isn't ready yet.
function useImageCanvas(
  imageUrl: string | null | undefined,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
) {
  useEffect(() => {
    if (!imageUrl || !canvasRef.current) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.drawImage(img, 0, 0);
    };
    img.src = imageUrl;
  }, [imageUrl, canvasRef]);
}

// Extracts the hex color at the click position on an image rendered
// from `canvas`. Returns null when the canvas/context is missing.
function pickColorAt(
  e: React.MouseEvent<HTMLImageElement>,
  canvas: HTMLCanvasElement,
): string | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const rect = e.currentTarget.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = Math.floor((e.clientX - rect.left) * scaleX);
  const y = Math.floor((e.clientY - rect.top) * scaleY);
  const pixel = ctx.getImageData(x, y, 1, 1).data;
  return `#${pixel[0].toString(16).padStart(2, "0")}${pixel[1].toString(16).padStart(2, "0")}${pixel[2].toString(16).padStart(2, "0")}`;
}

interface UseFileUploadInput {
  setLoadingState: (s: FileLoadingState) => void;
  onUploaded: (url: string) => void;
}

function useFileUpload({ setLoadingState, onUploaded }: UseFileUploadInput) {
  return useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        setLoadingState("compressing");
        const compressed = await compressImage(file);
        setLoadingState("uploading");
        const url = await uploadFile(compressed);
        onUploaded(url);
      } catch (err) {
        log.error("banner_image_upload_failed", err);
      } finally {
        setLoadingState(null);
        e.target.value = "";
      }
    },
    [setLoadingState, onUploaded],
  );
}

export function useBannerFormState(id?: string) {
  const edit = useBannerEdit(id);
  const { formData, updateFormData } = edit;

  const [desktopLoadingState, setDesktopLoadingState] = useState<FileLoadingState>(null);
  const [mobileLoadingState, setMobileLoadingState] = useState<FileLoadingState>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [linkType, setLinkType] = useState<LinkType>("none");
  const [isPickingColor, setIsPickingColor] = useState(false);
  const [isPickingMobileColor, setIsPickingMobileColor] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mobileCanvasRef = useRef<HTMLCanvasElement>(null);
  const desktopInputId = useId();
  const mobileInputId = useId();

  useImageCanvas(formData.image_url, canvasRef);
  useImageCanvas(formData.mobile_image_url, mobileCanvasRef);

  const handleColorPick = useCallback(
    (e: React.MouseEvent<HTMLImageElement>) => {
      if (!isPickingColor || !canvasRef.current) return;
      const hex = pickColorAt(e, canvasRef.current);
      if (!hex) return;
      updateFormData({ background_color: hex });
      setIsPickingColor(false);
    },
    [isPickingColor, updateFormData],
  );

  const handleMobileColorPick = useCallback(
    (e: React.MouseEvent<HTMLImageElement>) => {
      if (!isPickingMobileColor || !mobileCanvasRef.current) return;
      const hex = pickColorAt(e, mobileCanvasRef.current);
      if (!hex) return;
      updateFormData({ mobile_background_color: hex });
      setIsPickingMobileColor(false);
    },
    [isPickingMobileColor, updateFormData],
  );

  // Sync linkType when formData loads (for editing existing banner)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- derive UI-only linkType from loaded banner formData
    if (formData.category_id) setLinkType("category");
    else if (formData.product_id) setLinkType("product");
    else if (formData.link_url) setLinkType("link");
  }, [formData.category_id, formData.product_id, formData.link_url]);

  const handleLinkTypeChange = useCallback(
    (type: LinkType) => {
      setLinkType(type);
      if (type === "none") {
        updateFormData({ category_id: null, product_id: null, link_url: null });
      } else if (type === "category") {
        updateFormData({ product_id: null, link_url: null });
        setCategoryOpen(true);
      } else if (type === "product") {
        updateFormData({ category_id: null, link_url: null });
        setProductOpen(true);
      } else if (type === "link") {
        updateFormData({ category_id: null, product_id: null });
      }
    },
    [updateFormData],
  );

  const handleDesktopFileChange = useFileUpload({
    setLoadingState: setDesktopLoadingState,
    onUploaded: useCallback((url: string) => updateFormData({ image_url: url }), [updateFormData]),
  });

  const handleMobileFileChange = useFileUpload({
    setLoadingState: setMobileLoadingState,
    onUploaded: useCallback(
      (url: string) => updateFormData({ mobile_image_url: url }),
      [updateFormData],
    ),
  });

  return {
    ...edit,
    desktopLoadingState,
    mobileLoadingState,
    categoryOpen,
    setCategoryOpen,
    productOpen,
    setProductOpen,
    linkType,
    isPickingColor,
    setIsPickingColor,
    isPickingMobileColor,
    setIsPickingMobileColor,
    canvasRef,
    mobileCanvasRef,
    desktopInputId,
    mobileInputId,
    handleColorPick,
    handleMobileColorPick,
    handleLinkTypeChange,
    handleDesktopFileChange,
    handleMobileFileChange,
  };
}
