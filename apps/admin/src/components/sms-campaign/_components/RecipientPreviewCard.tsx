"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RecipientPreviewCardProps {
  filterType: "all" | "filter" | "manual";
  phoneCount: number;
  recipientCount: number | null;
  isPreviewLoading: boolean;
  onPreview: () => void;
}

function PreviewNumber({
  filterType,
  phoneCount,
  recipientCount,
  isPreviewLoading,
}: Omit<RecipientPreviewCardProps, "onPreview">) {
  if (isPreviewLoading) {
    return <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />;
  }
  if (filterType === "manual") {
    return <p className="text-3xl font-bold">{phoneCount}</p>;
  }
  if (recipientCount !== null) {
    return <p className="text-3xl font-bold">{recipientCount}</p>;
  }
  return <p className="text-muted-foreground text-sm">—</p>;
}

export function RecipientPreviewCard(props: RecipientPreviewCardProps) {
  const { filterType, isPreviewLoading, onPreview } = props;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Хүлээн авагчид</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-4">
          <PreviewNumber {...props} />
          <p className="text-sm text-muted-foreground mt-1">хүн</p>
        </div>
        {filterType !== "manual" && (
          <Button
            variant="outline"
            className="w-full"
            onClick={onPreview}
            disabled={isPreviewLoading}
          >
            {isPreviewLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Тоо шинэчлэх
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
