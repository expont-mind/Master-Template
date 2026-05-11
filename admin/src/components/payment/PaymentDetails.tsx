"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Loader2,
  CreditCard,
  User,
  Package,
  Clock,
  Save,
} from "lucide-react";
import { usePaymentEdit } from "@/hooks/usePaymentEdit";
import {
  TRANSACTION_STATUS_LABELS,
  TRANSACTION_STATUS_COLORS,
  PAYMENT_PROVIDER_LABELS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from "@/constants";
import type { TransactionStatus, OrderStatus } from "@/types/database";

interface PaymentDetailsProps {
  id: string;
}

export function PaymentDetails({ id }: PaymentDetailsProps) {
  const router = useRouter();
  const {
    payment,
    isLoading,
    isSaving,
    error,
    status,
    hasChanges,
    setStatus,
    handleSave,
  } = usePaymentEdit(id);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("mn-MN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Ulaanbaatar",
    });
  };

  const getProviderLabel = (provider: string) => {
    return (
      PAYMENT_PROVIDER_LABELS[provider as keyof typeof PAYMENT_PROVIDER_LABELS] ||
      provider
    );
  };

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              Төлбөр #{payment.id.slice(0, 8)}
            </h1>
            <p className="text-muted-foreground">
              {formatDate(payment.created_at)}
            </p>
          </div>
        </div>
        <Badge
          variant="secondary"
          className={TRANSACTION_STATUS_COLORS[payment.status as TransactionStatus]}
        >
          {TRANSACTION_STATUS_LABELS[payment.status as TransactionStatus]}
        </Badge>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Payment Info */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Төлбөрийн мэдээлэл
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Төлбөр ID</p>
                <p className="font-medium">{payment.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Захиалга ID</p>
                <Link
                  href={`/orders/${payment.order_id}`}
                  className="font-medium text-primary hover:underline"
                >
                  #{payment.order_id.slice(0, 8)}
                </Link>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Төлбөрийн хэрэгсэл</p>
                <p className="font-medium">{getProviderLabel(payment.provider)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Гүйлгээний дугаар</p>
                <p className="font-medium">
                  {payment.transaction_ref || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Дүн</p>
                <p className="text-xl font-bold">
                  ₮{payment.amount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Захиалгын дүн</p>
                <p className="text-xl font-bold">
                  ₮{payment.orders?.total_amount.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Order Items */}
            {payment.orders?.order_items && payment.orders.order_items.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Захиалгын барааны жагсаалт
                </h4>
                <div className="space-y-2">
                  {payment.orders.order_items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center py-2 border-b last:border-b-0"
                    >
                      <div>
                        <p className="font-medium">
                          {item.products?.name || "Бүтээгдэхүүн"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} x ₮{item.price.toLocaleString()}
                        </p>
                      </div>
                      <p className="font-medium">
                        ₮{(item.quantity * item.price).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Хэрэглэгч
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payment.orders?.users ? (
                <div className="space-y-2">
                  <p className="font-medium">
                    {[payment.orders.users.first_name, payment.orders.users.last_name].filter(Boolean).join(' ') || "Нэргүй"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {payment.orders.users.email}
                  </p>
                  {payment.orders.users.primary_phone && (
                    <p className="text-sm text-muted-foreground">
                      {payment.orders.users.primary_phone}
                    </p>
                  )}
                  <Link
                    href={`/users/${payment.orders.users.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    Хэрэглэгчийг харах
                  </Link>
                </div>
              ) : (
                <p className="text-muted-foreground">Мэдээлэл байхгүй</p>
              )}
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Төлөв</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Төлбөрийн төлөв
                </label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as TransactionStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRANSACTION_STATUS_LABELS).map(
                      ([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Захиалгын төлөв
                </label>
                <Badge
                  variant="secondary"
                  className={
                    ORDER_STATUS_COLORS[payment.orders?.status as OrderStatus]
                  }
                >
                  {ORDER_STATUS_LABELS[payment.orders?.status as OrderStatus]}
                </Badge>
              </div>

              <Button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className="w-full"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Хадгалж байна...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Хадгалах
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Огноо
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Үүсгэсэн</p>
                <p className="font-medium">{formatDate(payment.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Шинэчилсэн</p>
                <p className="font-medium">{formatDate(payment.updated_at)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
