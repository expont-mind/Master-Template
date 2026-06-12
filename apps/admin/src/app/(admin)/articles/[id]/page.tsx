import { use } from "react";

import { ArticleForm } from "@/components/article";

export default function ArticleEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ArticleForm id={id} />;
}
