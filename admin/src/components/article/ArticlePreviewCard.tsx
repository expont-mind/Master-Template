"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye } from "lucide-react";
import type { ContentSection } from "./ArticleContentCard";

interface ArticlePreviewCardProps {
  title: string;
  sections: ContentSection[];
  imageUrl?: string;
}

export function ArticlePreviewCard({ title, sections, imageUrl }: ArticlePreviewCardProps) {
  if (sections.length === 0 && !imageUrl) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Урьдчилан харах
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={title}
              className="w-full aspect-3/2 object-cover rounded-lg mb-4"
            />
          )}
          <h1 className="text-xl font-bold mb-4">{title || "Гарчиггүй"}</h1>
          {sections.map((section) => (
            <div key={section.id} className="mb-4">
              {section.title && (
                <h2 className="text-lg font-semibold mb-2">{section.title}</h2>
              )}
              {section.content && (
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {section.content}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
