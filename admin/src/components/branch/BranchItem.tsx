"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, MapPin, Phone, Mail } from "lucide-react";
import type { Branch } from "./types";

interface BranchItemProps {
  branch: Branch;
  onDelete: () => void;
}

export function BranchItem({ branch, onDelete }: BranchItemProps) {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-muted/50">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {branch.image_url && (
            <img
              src={branch.image_url}
              alt={branch.name}
              className="w-10 h-10 object-cover rounded"
            />
          )}
          <Link
            href={`/branches/${branch.id}`}
            className="font-medium hover:underline truncate"
          >
            {branch.name}
          </Link>
          <Badge variant={branch.is_active ? "secondary" : "outline"}>
            {branch.is_active ? "Идэвхтэй" : "Идэвхгүй"}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-muted-foreground">
          {branch.address && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="line-clamp-1">{branch.address.split('\n')[0]}</span>
            </span>
          )}
          {branch.phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {branch.phone}
            </span>
          )}
          {branch.email && (
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {branch.email}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link href={`/branches/${branch.id}`}>
          <Button variant="ghost" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
        </Link>
        <Button variant="ghost" size="icon" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
