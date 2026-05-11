"use client";

import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  onConfirm: () => Promise<void> | void;
  isLoading?: boolean;
}

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Тийм",
  cancelText = "Үгүй",
  variant = "default",
  onConfirm,
  isLoading: externalIsLoading,
}: ConfirmDialogProps) {
  const [internalIsLoading, setInternalIsLoading] = React.useState(false);
  const isLoading = externalIsLoading ?? internalIsLoading;

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    setInternalIsLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setInternalIsLoading(false);
    }
  };

  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/50",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
        />
        <AlertDialogPrimitive.Content
          className={cn(
            "fixed top-[50%] left-[50%] z-50 w-full max-w-md",
            "translate-x-[-50%] translate-y-[-50%]",
            "bg-background rounded-2xl shadow-2xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          )}
        >
          <div className="p-6">
            <AlertDialogPrimitive.Title className="text-xl font-semibold">
              {title}
            </AlertDialogPrimitive.Title>
            <AlertDialogPrimitive.Description className="text-sm text-muted-foreground mt-2">
              {description}
            </AlertDialogPrimitive.Description>
          </div>
          <div className="flex justify-end gap-3 px-6 py-4 border-t">
            <AlertDialogPrimitive.Cancel
              disabled={isLoading}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "rounded-lg px-6"
              )}
            >
              {cancelText}
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action
              onClick={handleConfirm}
              disabled={isLoading}
              className={cn(
                buttonVariants({
                  variant:
                    variant === "destructive" ? "destructive" : "default",
                }),
                "rounded-lg px-6"
              )}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                confirmText
              )}
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}

export { ConfirmDialog };
