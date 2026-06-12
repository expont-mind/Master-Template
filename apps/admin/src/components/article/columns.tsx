"use client";

import Image from "next/image";

import { BadgeCell, DateCell, ActionsCell } from "@/components/ui/data-table";
import { CONTENT_STATUS_LABELS, CONTENT_STATUS_COLORS } from "@/constants";

import { ARTICLE_TYPES } from "./types";

import type { Article } from "./types";
import type { ColumnDef } from "@tanstack/react-table";

export function getColumns(options: {
  onDelete?: (article: Article) => void;
}): ColumnDef<Article>[] {
  return [
    {
      accessorKey: "image_url",
      header: "",
      size: 60,
      cell: ({ row }) => {
        const imageUrl = row.original.image_url;
        if (!imageUrl) {
          return (
            <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">
              -
            </div>
          );
        }
        return (
          <Image
            src={imageUrl}
            alt={row.original.title}
            width={40}
            height={40}
            className="w-10 h-10 object-cover rounded"
          />
        );
      },
    },
    {
      accessorKey: "title",
      header: "Гарчиг",
      cell: ({ row }) => (
        <div>
          <span className="font-medium">{row.original.title}</span>
          {row.original.is_featured && (
            <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
              Онцлох
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Төрөл",
      size: 100,
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {ARTICLE_TYPES[row.original.type as keyof typeof ARTICLE_TYPES] || row.original.type}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Төлөв",
      size: 120,
      cell: ({ row }) => (
        <BadgeCell
          value={row.original.status}
          labels={CONTENT_STATUS_LABELS}
          colors={CONTENT_STATUS_COLORS}
        />
      ),
    },
    {
      accessorKey: "published_at",
      header: "Нийтлэгдсэн",
      size: 140,
      cell: ({ row }) =>
        row.original.published_at ? (
          <DateCell value={row.original.published_at} />
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      id: "actions",
      header: "",
      size: 80,
      cell: ({ row }) => (
        <ActionsCell
          editHref={`/articles/${row.original.id}`}
          onDelete={options.onDelete ? () => options.onDelete!(row.original) : undefined}
        />
      ),
    },
  ];
}
