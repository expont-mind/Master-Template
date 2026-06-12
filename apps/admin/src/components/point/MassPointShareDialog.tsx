"use client";

import { AlertTriangle, Coins, Loader2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { FilterControls } from "./_mass-point/_FilterControls";
import { MatchCountRow } from "./_mass-point/_MatchCountRow";
import { PreviewTable } from "./_mass-point/_PreviewTable";
import { useMassPointShare, type MassPointShareState } from "./_mass-point/_useMassPointShare";

interface MassPointShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function SummaryBox({ matchCount, amount }: { matchCount: number; amount: string }) {
  const amountNum = parseInt(amount);
  if (matchCount === 0 || !amount || !amountNum || amountNum <= 0) return null;
  return (
    <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
      <span className="font-medium">{matchCount.toLocaleString()}</span> хэрэглэгчид тус бүрт{" "}
      <span className="font-medium">{amountNum.toLocaleString()}</span> MP, нийт{" "}
      <span className="font-semibold">{(matchCount * amountNum).toLocaleString()}</span> MP өгнө
    </div>
  );
}

function ConfirmWarning({ matchCount }: { matchCount: number }) {
  return (
    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-2 text-sm text-amber-800">
      <AlertTriangle className="size-4 shrink-0 mt-0.5" />
      <span>
        <span className="font-semibold">{matchCount.toLocaleString()}</span> хэрэглэгчид point өгөх
        гэж байна. Итгэлтэй бол дахин дарна уу.
      </span>
    </div>
  );
}

function SubmitButtonLabel({
  confirming,
  matchCount,
}: {
  confirming: boolean;
  matchCount: number;
}) {
  if (confirming) return <>Баталгаажуулах</>;
  if (matchCount > 0) return <>{matchCount.toLocaleString()} хэрэглэгчид өгөх</>;
  return <>Өгөх</>;
}

function DialogBody({ state }: { state: MassPointShareState }) {
  return (
    <div className="space-y-4">
      <FilterControls
        pointFilter={state.pointFilter}
        statusFilter={state.statusFilter}
        onChangePointFilter={(v) => {
          state.setPointFilter(v);
          state.clearConfirm();
          state.clearPreview();
        }}
        onChangeStatusFilter={(v) => {
          state.setStatusFilter(v);
          state.clearConfirm();
          state.clearPreview();
        }}
      />

      <MatchCountRow
        matchCount={state.matchCount}
        isCounting={state.isCounting}
        isLoadingPreview={state.isLoadingPreview}
        onPreview={state.handlePreview}
      />

      {state.previewUsers && (
        <PreviewTable users={state.previewUsers} totalMatch={state.matchCount} />
      )}

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="mass-point-amount">Дүн (хэрэглэгч бүрт)</Label>
        <div className="relative">
          <Input
            id="mass-point-amount"
            type="number"
            min="1"
            placeholder="10,000"
            value={state.amount}
            onChange={(e) => {
              state.setAmount(e.target.value);
              state.clearConfirm();
            }}
            className="pr-14"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-muted-foreground pointer-events-none">
            <Coins className="size-3.5" />
            <span className="text-xs font-medium">MP</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mass-point-description">Тайлбар</Label>
        <Textarea
          id="mass-point-description"
          placeholder="Урамшуулал, бонус гэх мэт..."
          value={state.description}
          onChange={(e) => {
            state.setDescription(e.target.value);
            state.clearConfirm();
          }}
          rows={3}
        />
      </div>

      <SummaryBox matchCount={state.matchCount} amount={state.amount} />
      {state.confirming && <ConfirmWarning matchCount={state.matchCount} />}
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </div>
  );
}

export function MassPointShareDialog({ open, onOpenChange }: MassPointShareDialogProps) {
  const state = useMassPointShare(open, () => onOpenChange(false));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Mass Point өгөх
          </DialogTitle>
        </DialogHeader>

        <DialogBody state={state} />

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={state.mutationPending}
          >
            Болих
          </Button>
          <Button
            onClick={state.handleSubmit}
            disabled={state.mutationPending || state.isCounting || state.matchCount === 0}
            variant={state.confirming ? "destructive" : "default"}
          >
            {state.mutationPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <SubmitButtonLabel confirming={state.confirming} matchCount={state.matchCount} />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
