"use client";

import { Plus } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCustomOptionTypes } from "@/hooks/useCustomOptionTypes";

import { OptionGroupCard } from "./OptionGroupCard";
import { OPTION_TYPES } from "./types";
import { VariantsTable } from "./VariantsTable";

import type { GeneratedVariant, OptionGroup } from "./types";

function generateSku(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  let random = "";
  for (let i = 0; i < 4; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SKU-${timestamp}${random}`;
}

/**
 * Generate the cartesian product of required option groups, then extend
 * each base combination with every non-empty subset of optional groups.
 * Existing variants are preserved by combination string.
 */
function generateVariantCombinations(
  groups: OptionGroup[],
  existing: GeneratedVariant[],
  basePrice: string,
): GeneratedVariant[] {
  const requiredGroups = groups.filter((g) => g.values.length > 0 && g.is_required !== false);
  const optionalGroups = groups.filter((g) => g.values.length > 0 && g.is_required === false);
  if (requiredGroups.length === 0) return [];

  const cartesian = (gs: OptionGroup[]): string[][] =>
    gs.reduce<string[][]>((acc, group) => {
      if (acc.length === 0) return group.values.map((v) => [v]);
      return acc.flatMap((combo) => group.values.map((v) => [...combo, v]));
    }, []);

  const baseCombinations = cartesian(requiredGroups);
  const all: string[][] = [...baseCombinations];

  if (optionalGroups.length > 0) {
    for (let i = 1; i < 1 << optionalGroups.length; i++) {
      const subset: OptionGroup[] = [];
      for (let j = 0; j < optionalGroups.length; j++) {
        if (i & (1 << j)) subset.push(optionalGroups[j]);
      }
      const optCombinations = cartesian(subset);
      for (const base of baseCombinations) {
        for (const opt of optCombinations) {
          all.push([...base, ...opt]);
        }
      }
    }
  }

  return all.map((combo, index) => {
    const combinationStr = combo.join(" / ");
    const existingVariant = existing.find((v) => v.combination === combinationStr);
    if (existingVariant) return existingVariant;
    return {
      id: `variant-${Date.now()}-${index}`,
      combination: combinationStr,
      optionValues: combo,
      price: basePrice || "",
      discountPrice: "",
      stockQuantity: "",
      sku: generateSku(),
      status: "active" as const,
      imageUrl: "",
    };
  });
}

interface ProductOptionsTabProps {
  optionGroups: OptionGroup[];
  setOptionGroups: (groups: OptionGroup[]) => void;
  generatedVariants: GeneratedVariant[];
  setGeneratedVariants: (variants: GeneratedVariant[]) => void;
  basePrice: string;
}

export function ProductOptionsTab({
  optionGroups,
  setOptionGroups,
  generatedVariants,
  setGeneratedVariants,
  basePrice,
}: ProductOptionsTabProps) {
  const [newValueInputs, setNewValueInputs] = useState<Record<string, string>>({});
  const { customTypes, addCustomType } = useCustomOptionTypes();

  const regenerate = useCallback(
    (groups: OptionGroup[]) => {
      setGeneratedVariants(generateVariantCombinations(groups, generatedVariants, basePrice));
    },
    [generatedVariants, basePrice, setGeneratedVariants],
  );

  const addOptionGroup = () => {
    const usedTypes = optionGroups.map((g) => g.type);
    const availableType = OPTION_TYPES.find((t) => !usedTypes.includes(t)) || "";
    setOptionGroups([
      ...optionGroups,
      {
        id: `group-${Date.now()}`,
        type: availableType,
        values: [],
        is_required: true,
      },
    ]);
  };

  const removeOptionGroup = (groupId: string) => {
    const newGroups = optionGroups.filter((g) => g.id !== groupId);
    setOptionGroups(newGroups);
    regenerate(newGroups);
  };

  const updateGroupType = (groupId: string, type: string) => {
    setOptionGroups(optionGroups.map((g) => (g.id === groupId ? { ...g, type } : g)));
  };

  const updateGroupRequired = (groupId: string, isRequired: boolean) => {
    const newGroups = optionGroups.map((g) =>
      g.id === groupId ? { ...g, is_required: isRequired } : g,
    );
    setOptionGroups(newGroups);
    regenerate(newGroups);
  };

  const addValueToGroup = (groupId: string, value: string) => {
    if (!value.trim()) return;
    const newGroups = optionGroups.map((g) =>
      g.id === groupId && !g.values.includes(value.trim())
        ? { ...g, values: [...g.values, value.trim()] }
        : g,
    );
    setOptionGroups(newGroups);
    setNewValueInputs((prev) => ({ ...prev, [groupId]: "" }));
    regenerate(newGroups);
  };

  const removeValueFromGroup = (groupId: string, value: string) => {
    const newGroups = optionGroups.map((g) =>
      g.id === groupId ? { ...g, values: g.values.filter((v) => v !== value) } : g,
    );
    setOptionGroups(newGroups);
    regenerate(newGroups);
  };

  const updateVariant = (variantId: string, field: keyof GeneratedVariant, value: string) => {
    setGeneratedVariants(
      generatedVariants.map((v) => (v.id === variantId ? { ...v, [field]: value } : v)),
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, groupId: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addValueToGroup(groupId, newValueInputs[groupId] || "");
    }
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-4">
          {optionGroups.map((group, index) => (
            <OptionGroupCard
              key={group.id}
              group={group}
              index={index}
              onRemove={() => removeOptionGroup(group.id)}
              onTypeChange={(type) => updateGroupType(group.id, type)}
              onRequiredChange={(isRequired) => updateGroupRequired(group.id, isRequired)}
              onAddValue={(value) => addValueToGroup(group.id, value)}
              onRemoveValue={(value) => removeValueFromGroup(group.id, value)}
              newValueInput={newValueInputs[group.id] || ""}
              onNewValueInputChange={(value) =>
                setNewValueInputs((prev) => ({ ...prev, [group.id]: value }))
              }
              onKeyPress={(e) => handleKeyPress(e, group.id)}
              usedTypes={optionGroups.filter((g) => g.id !== group.id).map((g) => g.type)}
              customTypes={customTypes}
              onAddCustomType={addCustomType}
            />
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addOptionGroup}
            className="text-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Сонголт нэмэх
          </Button>
        </div>

        {generatedVariants.length > 0 && (
          <VariantsTable variants={generatedVariants} updateVariant={updateVariant} />
        )}
      </CardContent>
    </Card>
  );
}
