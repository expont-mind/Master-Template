"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TRANSACTION_STATUS_COLORS, TRANSACTION_STATUS_LABELS } from "@/constants";
import { usePaymentEdit } from "@/hooks/usePaymentEdit";

import {
  formatPaymentDate,
  PaymentCustomerCard,
  PaymentInfoCard,
  PaymentStatusCard,
  PaymentTimestampsCard,
} from "./_PaymentCards";

import type { OrderStatus, TransactionStatus } from "@/types/database";

interface PaymentDetailsProps {
  id: string;
}

export function PaymentDetails({ id }: PaymentDetailsProps) {
  const router = useRouter();
  const { payment, isLoading, isSaving, error, status, hasChanges, setStatus, handleSave } =
    usePaymentEdit(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h3 className="text-lg font-medium">Төлбөр олдсонгүй</h3>
        <Link href="/payments">
          <Button variant="link">Буцах</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Төлбөр #{payment.id.slice(0, 8)}</h1>
            <p className="text-muted-foreground">{formatPaymentDate(payment.created_at)}</p>
          </div>
        </div>
        <Badge
          variant="secondary"
          className={TRANSACTION_STATUS_COLORS[payment.status as TransactionStatus]}
        >
          {TRANSACTION_STATUS_LABELS[payment.status as TransactionStatus]}
        </Badge>
      </div>

      {error && <div className="bg-destructive/10 text-destructive p-4 rounded-lg">{error}</div>}

      <div className="grid gap-6 md:grid-cols-3">
        <PaymentInfoCard payment={payment} />
        <div className="space-y-6">
          <PaymentCustomerCard customer={payment.orders?.users} />
          <PaymentStatusCard
            status={status}
            orderStatus={payment.orders?.status as OrderStatus | undefined}
            hasChanges={Boolean(hasChanges)}
            isSaving={isSaving}
            setStatus={setStatus}
            onSave={handleSave}
          />
          <PaymentTimestampsCard createdAt={payment.created_at} updatedAt={payment.updated_at} />
        </div>
      </div>
    </div>
  );
}
