"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";
import { translateServerError } from "@/lib/utils/error-messages";

import type { FAQ } from "@/components/faq/types";
import type { ContentStatus } from "@/types/database";

export function useFaqEdit(id: string) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNew = id === "new";

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState<string>("general");
  const [sortOrder, setSortOrder] = useState(0);
  const [status, setStatus] = useState<ContentStatus>("draft");

  const { data: faq = null, isLoading } = useQuery({
    queryKey: queryKeys.faqs.detail(id),
    queryFn: () => adminApi.getById<FAQ>("faqs", id),
    enabled: !isNew,
  });

  useEffect(() => {
    if (faq) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuestion(faq.question);
      setAnswer(faq.answer);
      setCategory(faq.category || "general");
      setSortOrder(faq.sort_order);
      setStatus(faq.status);
    }
  }, [faq]);

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      isNew ? adminApi.insert("faqs", data) : adminApi.update("faqs", id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.faqs.all });
      router.push("/faqs");
    },
  });

  const handleSave = async () => {
    if (!question.trim() || !answer.trim()) {
      setError("Асуулт болон хариултыг заавал бөглөнө үү.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const data: Record<string, unknown> = {
        question: question.trim(),
        answer: answer.trim(),
        category,
        sort_order: sortOrder,
        status,
      };

      if (!isNew) {
        data.updated_at = new Date().toISOString();
      }

      await saveMutation.mutateAsync(data);
    } catch (err) {
      setError(
        translateServerError(
          err instanceof Error ? err.message : "",
          "FAQ хадгалахад алдаа гарлаа.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
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
    category,
    setCategory,
    sortOrder,
    setSortOrder,
    status,
    setStatus,
    handleSave,
  };
}
