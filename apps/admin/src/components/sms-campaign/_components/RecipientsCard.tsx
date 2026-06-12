"use client";

import { Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { USER_STATUS_LABELS } from "@/constants";

import type { RecipientFilter } from "@/components/sms-campaign/types";

interface RecipientsCardProps {
  filter: RecipientFilter;
  disabled: boolean;
  manualPhones: string;
  onChangeManualPhones: (value: string) => void;
  onUpdateFilter: (patch: Partial<RecipientFilter>) => void;
}

function FilterOptions({
  filter,
  disabled,
  onUpdateFilter,
}: Omit<RecipientsCardProps, "manualPhones" | "onChangeManualPhones">) {
  return (
    <div className="ml-6 space-y-4 border-l-2 pl-4">
      <div className="space-y-2">
        <Label>Хэрэглэгчийн төлөв</Label>
        <Select
          value={filter.user_status ?? "all"}
          onValueChange={(value) =>
            onUpdateFilter({ user_status: value === "all" ? undefined : value })
          }
          disabled={disabled}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Бүгд" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Бүгд</SelectItem>
            {Object.entries(USER_STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="has_orders"
          checked={filter.has_orders ?? false}
          onCheckedChange={(checked) => onUpdateFilter({ has_orders: checked === true })}
          disabled={disabled}
        />
        <Label htmlFor="has_orders">Захиалга хийсэн хэрэглэгч</Label>
      </div>

      <div className="space-y-2">
        <Label>Бүртгүүлсэн огноо</Label>
        <DateRangePicker
          from={filter.registered_after ? new Date(filter.registered_after) : undefined}
          to={filter.registered_before ? new Date(filter.registered_before) : undefined}
          onChange={(range) =>
            onUpdateFilter({
              registered_after: range.from ? range.from.toISOString().split("T")[0] : undefined,
              registered_before: range.to ? range.to.toISOString().split("T")[0] : undefined,
            })
          }
        />
      </div>
    </div>
  );
}

function ManualPhonesInput({
  manualPhones,
  filter,
  disabled,
  onChangeManualPhones,
  onUpdateFilter,
}: Pick<
  RecipientsCardProps,
  "manualPhones" | "filter" | "disabled" | "onChangeManualPhones" | "onUpdateFilter"
>) {
  return (
    <div className="ml-6 space-y-2 border-l-2 pl-4">
      <Label>Утасны дугаарууд (мөр бүрт нэг)</Label>
      <Textarea
        value={manualPhones}
        onChange={(e) => {
          onChangeManualPhones(e.target.value);
          const phones = e.target.value
            .split(/[,\n]+/)
            .map((p) => p.trim())
            .filter((p) => p.length > 0);
          onUpdateFilter({ phones });
        }}
        placeholder={"99001122,99003344,88112233"}
        rows={6}
        disabled={disabled}
      />
      <p className="text-xs text-muted-foreground">{(filter.phones ?? []).length} дугаар</p>
    </div>
  );
}

export function RecipientsCard(props: RecipientsCardProps) {
  const { filter, disabled, onUpdateFilter } = props;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Хүлээн авагчид
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup
          value={filter.type}
          onValueChange={(value: string) =>
            onUpdateFilter({ type: value as RecipientFilter["type"] })
          }
          disabled={disabled}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="all" id="all" />
            <Label htmlFor="all">Бүх хэрэглэгч (утасны дугаартай)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="filter" id="filter" />
            <Label htmlFor="filter">Шүүлтүүрээр</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="manual" id="manual" />
            <Label htmlFor="manual">Гар оруулга</Label>
          </div>
        </RadioGroup>

        {filter.type === "filter" && (
          <FilterOptions filter={filter} disabled={disabled} onUpdateFilter={onUpdateFilter} />
        )}
        {filter.type === "manual" && <ManualPhonesInput {...props} />}
      </CardContent>
    </Card>
  );
}
