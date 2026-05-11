"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useFaqEdit } from "@/hooks/useFaqEdit";
import { FaqEditHeader } from "./FaqEditHeader";
import { FaqContentCard } from "./FaqContentCard";
import { FaqSettingsCard } from "./FaqSettingsCard";
import { FaqInfoCard } from "./FaqInfoCard";

interface FaqFormProps {
  id: string;
}

export function FaqForm({ id }: FaqFormProps) {
  const {
    faq,
    isNew,
    isLoading,
    isSaving,
    error,
    question,
    setQuestion,
    answer,
    setAnswer,
    category,
    setCategory,
    sortOrder,
    setSortOrder,
    status,
    setStatus,
    handleSave,
  } = useFaqEdit(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isNew && !faq) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h3 className="text-lg font-medium">Асуулт олдсонгүй</h3>
        <Link href="/faqs">
          <Button variant="link">Буцах</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FaqEditHeader
        isNew={isNew}
        id={id}
        isSaving={isSaving}
        onSave={handleSave}
      />

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <FaqContentCard
            question={question}
            setQuestion={setQuestion}
            answer={answer}
            setAnswer={setAnswer}
          />
        </div>

        <div className="space-y-6">
          <FaqSettingsCard
            status={status}
            setStatus={setStatus}
            category={category}
            setCategory={setCategory}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
          />

          {!isNew && faq && <FaqInfoCard faq={faq} />}
        </div>
      </div>
    </div>
  );
}
