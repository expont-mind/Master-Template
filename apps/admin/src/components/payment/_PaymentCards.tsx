"use client";

import { Clock, CreditCard, Loader2, Package, Save, User } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  PAYMENT_PROVIDER_LABELS,
  TRANSACTION_STATUS_LABELS,
} from "@/constants";

import type { OrderStatus, TransactionStatus } from "@/types/database";

export function formatPaymentDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ulaanbaatar",
  });
}

function getProviderLabel(provider: string): string {
  return PAYMENT_PROVIDER_LABELS[provider as keyof typeof PAYMENT_PROVIDER_LABELS] || provider;
}

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  products?: { name?: string } | null;
}

interface PaymentInfoCardProps {
  payment: {
    id: string;
    order_id: string;
    provider: string;
    transaction_ref: string | null;
    amount: number;
    orders?: {
      total_amount: number;
      order_items?: OrderItem[] | null;
    } | null;
  };
}

export function PaymentInfoCard({ payment }: PaymentInfoCardProps) {
  return (
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
            <p className="font-medium">{payment.transaction_ref || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Дүн</p>
            <p className="text-xl font-bold">₮{payment.amount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Захиалгын дүн</p>
            <p className="text-xl font-bold">₮{payment.orders?.total_amount.toLocaleString()}</p>
          </div>
        </div>

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
                    <p className="font-medium">{item.products?.name || "Бүтээгдэхүүн"}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} x ₮{item.price.toLocaleString()}
                    </p>
                  </div>
                  <p className="font-medium">₮{(item.quantity * item.price).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface CustomerInfo {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  primary_phone: string | null;
}

export function PaymentCustomerCard({ customer }: { customer: CustomerInfo | null | undefined }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Хэрэглэгч
        </CardTitle>
      </CardHeader>
      <CardContent>
        {customer ? (
          <div className="space-y-2">
            <p className="font-medium">
              {[customer.first_name, customer.last_name].filter(Boolean).join(" ") || "Нэргүй"}
            </p>
            <p className="text-sm text-muted-foreground">{customer.email}</p>
            {customer.primary_phone && (
              <p className="text-sm text-muted-foreground">{customer.primary_phone}</p>
            )}
            <Link href={`/users/${customer.id}`} className="text-sm text-primary hover:underline">
              Хэрэглэгчийг харах
            </Link>
          </div>
        ) : (
          <p className="text-muted-foreground">Мэдээлэл байхгүй</p>
        )}
      </CardContent>
    </Card>
  );
}

interface PaymentStatusCardProps {
  status: TransactionStatus;
  orderStatus: OrderStatus | undefined;
  hasChanges: boolean;
  isSaving: boolean;
  setStatus: (s: TransactionStatus) => void;
  onSave: () => void;
}

export function PaymentStatusCard({
  status,
  orderStatus,
  hasChanges,
  isSaving,
  setStatus,
  onSave,
}: PaymentStatusCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Төлөв</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2 block">Төлбөрийн төлөв</p>
          <Select value={status} onValueChange={(value) => setStatus(value as TransactionStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TRANSACTION_STATUS_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-2 block">Захиалгын төлөв</p>
          <Badge
            variant="secondary"
            className={orderStatus ? ORDER_STATUS_COLORS[orderStatus] : ""}
          >
            {orderStatus ? ORDER_STATUS_LABELS[orderStatus] : "-"}
          </Badge>
        </div>

        <Button onClick={onSave} disabled={!hasChanges || isSaving} className="w-full">
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
  );
}

export function PaymentTimestampsCard({
  createdAt,
  updatedAt,
}: {
  createdAt: string;
  updatedAt: string;
}) {
  return (
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
          <p className="font-medium">{formatPaymentDate(createdAt)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Шинэчилсэн</p>
          <p className="font-medium">{formatPaymentDate(updatedAt)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
