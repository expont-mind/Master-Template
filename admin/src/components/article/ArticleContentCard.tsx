"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileText, Plus, Trash2, GripVertical } from "lucide-react";

export interface ContentSection {
  id: string;
  title: string;
  content: string;
}

interface ArticleContentCardProps {
  title: string;
  onTitleChange: (value: string) => void;
  sections: ContentSection[];
  onSectionsChange: (sections: ContentSection[]) => void;
}

export function ArticleContentCard({
  title,
  onTitleChange,
  sections,
  onSectionsChange,
}: ArticleContentCardProps) {
  const addSection = () => {
    const newSection: ContentSection = {
      id: crypto.randomUUID(),
      title: "",
      content: "",
    };
    onSectionsChange([...sections, newSection]);
  };

  const updateSection = (id: string, field: "title" | "content", value: string) => {
    onSectionsChange(
      sections.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const removeSection = (id: string) => {
    onSectionsChange(sections.filter((s) => s.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Нийтлэлийн агуулга
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Гарчиг *</Label>
          <Input
            id="title"
            placeholder="Нийтлэлийн гарчиг"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
          />
        </div>

        {/* Sections */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Хэсгүүд</Label>
            <Button type="button" variant="outline" size="sm" onClick={addSection}>
              <Plus className="h-4 w-4 mr-1" />
              Хэсэг нэмэх
            </Button>
          </div>

          {sections.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground text-sm mb-3">
                Хэсэг байхгүй байна
              </p>
              <Button type="button" variant="outline" size="sm" onClick={addSection}>
                <Plus className="h-4 w-4 mr-1" />
                Эхний хэсгийг нэмэх
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {sections.map((section, index) => (
                <div
                  key={section.id}
                  className="border rounded-lg p-4 space-y-3 bg-muted/30"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex items-center gap-1 text-muted-foreground pt-2">
                      <GripVertical className="h-4 w-4" />
                      <span className="text-xs font-medium">{index + 1}</span>
                    </div>
                    <div className="flex-1 space-y-3">
                      <Input
                        placeholder="Хэсгийн гарчиг (жишээ: Солих нөхцөл)"
                        value={section.title}
                        onChange={(e) =>
                          updateSection(section.id, "title", e.target.value)
                        }
                      />
                      <Textarea
                        placeholder="Хэсгийн агуулга..."
                        rows={4}
                        value={section.content}
                        onChange={(e) =>
                          updateSection(section.id, "content", e.target.value)
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeSection(section.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
