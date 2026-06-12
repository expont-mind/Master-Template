"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";

import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";
import { translateServerError } from "@/lib/utils/error-messages";

import type { PointFaq } from "@/components/point/types";
import type { ContentStatus } from "@/types/database";

export function usePointFaqEdit(id: string | null) {
  const queryClient = useQueryClient();
  const isNew = !id;

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [status, setStatus] = useState<ContentStatus>("draft");

  const { data: faq = null, isLoading } = useQuery({
    queryKey: queryKeys.pointFaqs.detail(id ?? ""),
    queryFn: () => adminApi.getById<PointFaq>("faqs", id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (faq) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- prefill form fields from saved FAQ after async fetch resolves
      setQuestion(faq.question);
      setAnswer(faq.answer);
      setSortOrder(faq.sort_order);
      setStatus(faq.status);
    }
  }, [faq]);

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      isNew ? adminApi.insert("faqs", data) : adminApi.update("faqs", id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pointFaqs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.faqs.all });
    },
  });

  const handleSave = async (): Promise<boolean> => {
    if (!question.trim() || !answer.trim()) {
      setError("Асуулт болон хариултыг заавал бөглөнө үү.");
      return false;
    }

    setIsSaving(true);
    setError(null);

    try {
      const data: Record<string, unknown> = {
        question: question.trim(),
        answer: answer.trim(),
        category: "point",
        sort_order: sortOrder,
        status,
      };

      if (!isNew) {
        data.updated_at = new Date().toISOString();
      }

      await saveMutation.mutateAsync(data);
      return true;
    } catch (err) {
      setError(
        translateServerError(
          err instanceof Error ? err.message : "",
          "FAQ хадгалахад алдаа гарлаа.",
        ),
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const reset = () => {
    setQuestion("");
    setAnswer("");
    setSortOrder(0);
    setStatus("draft");
    setError(null);
  };

  return {
    faq,
    isNew,
    isLoading,
    isSaving,
    error,
    question,
    setQuestion,
    answer,
    setAnswer,
    sortOrder,
    setSortOrder,
    status,
    setStatus,
    handleSave,
    reset,
  };
}
