"use client";

import { Loader2, Save } from "lucide-react";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { Policy, PolicyType } from "./types";

interface PolicyCardProps {
  policyType: PolicyType;
  policy: Policy | null;
  isSaving: boolean;
  onSave: (content: string) => void;
  onToggleActive: () => void;
}

export function PolicyCard({
  policyType,
  policy,
  isSaving,
  onSave,
  onToggleActive,
}: PolicyCardProps) {
  const [content, setContent] = useState(policy?.content || "");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setContent(policy?.content || "");
    setHasChanges(false);
  }, [policy]);

  const handleContentChange = (value: string) => {
    setContent(value);
    setHasChanges(value !== (policy?.content || ""));
  };

  const handleSave = () => {
    onSave(content);
    setHasChanges(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{policyType.label}</h3>
        <div className="flex items-center gap-3">
          {policy && policy.content && (
            <div className="flex items-center gap-2">
              <Checkbox
                id={`active-${policyType.value}`}
                checked={policy.is_active}
                onCheckedChange={onToggleActive}
              />
              <Label htmlFor={`active-${policyType.value}`} className="text-sm cursor-pointer">
                Идэвхтэй
              </Label>
            </div>
          )}
          <Button size="sm" onClick={handleSave} disabled={isSaving || !hasChanges}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Save className="h-4 w-4 mr-1" />
                Хадгалах
              </>
            )}
          </Button>
        </div>
      </div>

      <Textarea
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        placeholder={`${policyType.label}-ын агуулгыг энд бичнэ үү...`}
        rows={6}
        className="resize-y"
      />
    </div>
  );
}
