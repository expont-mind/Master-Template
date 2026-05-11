"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import { Category } from "@/components/category/types";
import { queryKeys } from "@/lib/query-keys";
import { translateServerError } from "@/lib/utils/error-messages";

export function useCategoryEdit(id: string) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [parentId, setParentId] = useState<string>("");

  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.categories.lists(),
    queryFn: () =>
      adminApi.getAll<Category>("categories", {
        select: "id, name, parent_id, image",
        order: "name.asc",
      }),
  });

  const currentCategory = categories.find((c) => c.id === id) || null;

  useEffect(() => {
    if (currentCategory) {
      setName(currentCategory.name);
      setImage(currentCategory.image || "");
      setParentId(currentCategory.parent_id || "");
    }
  }, [currentCategory]);

  const getCategoryPath = (categoryId: string): string => {
    const paths: string[] = [];
    let currentId: string | null = categoryId;
    while (currentId) {
      const cat = categories.find((c) => c.id === currentId);
      if (cat) {
        paths.unshift(cat.name);
        currentId = cat.parent_id;
      } else break;
    }
    return paths.join(" → ");
  };

  const getDescendantIds = (categoryId: string): Set<string> => {
    const descendants = new Set<string>();
    const findChildren = (pId: string) => {
      categories.forEach((cat) => {
        if (cat.parent_id === pId) {
          descendants.add(cat.id);
          findChildren(cat.id);
        }
      });
    };
    findChildren(categoryId);
    return descendants;
  };

  const availableParents = categories.filter((cat) => {
    if (cat.id === id) return false;
    return !getDescendantIds(id).has(cat.id);
  });

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      adminApi.update("categories", id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      router.push("/categories");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.delete("categories", id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      router.push("/categories");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (!name.trim()) throw new Error("Ангилалын нэр оруулна уу");

      // Generate slug from name
      const baseSlug = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-");

      // If slug is empty (e.g., all Mongolian text), generate a random one
      const slug = baseSlug || `category-${Date.now()}`;

      await updateMutation.mutateAsync({
        name: name.trim(),
        slug,
        image: image || null,
        parent_id: parentId || null,
      });
    } catch (err) {
      setError(translateServerError(err instanceof Error ? err.message : "", "Ангилал хадгалахад алдаа гарлаа."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const hasChildren = categories.some((cat) => cat.parent_id === id);
      if (hasChildren) {
        throw new Error(
          "Дэд ангилалтай ангилалыг устгах боломжгүй. Эхлээд дэд ангилалуудыг устгана уу."
        );
      }
      await deleteMutation.mutateAsync();
    } catch (err) {
      setError(translateServerError(err instanceof Error ? err.message : "", "Ангилал устгахад алдаа гарлаа."));
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    isLoading,
    isDeleting,
    error,
    currentCategory,
    name,
    image,
    parentId,
    availableParents,
    categoryPath: getCategoryPath(id),
    setName,
    setImage,
    setParentId,
    handleSubmit,
    handleDelete,
  };
}
