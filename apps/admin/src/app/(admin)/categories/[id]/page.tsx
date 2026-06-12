"use client";

import { use } from "react";

import { CategoryEditForm } from "@/components/category";

export default function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <CategoryEditForm id={id} />;
}
