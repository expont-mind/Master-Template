"use client";

// Top-level Banner form. State + handlers live in useBannerFormState;
// the section composition lives in BannerFormBody. This file is the
// thin orchestrator that handles the loading/error states, header,
// hidden color-picker canvases, and Save CTA.

import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import { BannerFormBody } from "./_BannerFormBody";
import { useBannerFormState } from "./_useBannerFormState";

interface BannerFormProps {
  id?: string;
}

function BannerSaveButton({ isSaving, onSave }: { isSaving: boolean; onSave: () => void }) {
  return (
    <Button onClick={onSave} disabled={isSaving} className="w-full bg-green-500 hover:bg-green-600">
      {isSaving ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Хадгалж байна...
        </>
      ) : (
        <>
          <Save className="mr-2 h-4 w-4" />
          Хадгалах
        </>
      )}
    </Button>
  );
}

export function BannerForm({ id }: BannerFormProps) {
  const state = useBannerFormState(id);
  const { isLoading, isSaving, error, isEditMode, handleSave, canvasRef, mobileCanvasRef } = state;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/banners">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{isEditMode ? "Баннер засах" : "Шинэ баннер"}</h1>
      </div>

      {error && <div className="bg-destructive/10 text-destructive p-4 rounded-lg">{error}</div>}

      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={mobileCanvasRef} className="hidden" />

      <BannerFormBody state={state} />

      <div className="max-w-2xl">
        <BannerSaveButton isSaving={isSaving} onSave={handleSave} />
      </div>
    </div>
  );
}
