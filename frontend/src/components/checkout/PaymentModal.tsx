"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useScrollLock } from "@/lib/hooks/useScrollLock";
import { Cancel, Payment, Reload, Success } from "@/components/svg";
import { Spinner } from "@/components/ui/Spinner";
import { formatPrice } from "@/components/checkout/constants";
import type { QPayInvoiceData } from "@/lib/qpay/types";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { STOREPAY_MIN_AMOUNT } from "@/lib/utils/constants";
import {
  BankAppCard,
  BankField,
  getBankDescription,
} from "./payment/BankComponents";
import { usePaymentPolling } from "./payment/usePaymentPolling";
import type {
  LendMNInvoiceData,
  OrderItemPayload,
  PaymentMethod,
  StorePayInvoiceData,
} from "./payment/types";
import {
  MutedMediumSm,
  MutedTextXs,
  PrimaryHeading,
  PrimaryMediumSm,
  PrimarySm,
} from "@/components/ui/typography";

// Re-export so existing consumers can keep importing from PaymentModal.
// (checkout/page.tsx and profile/OrderDetailView.tsx both import these.)
export type {
  LendMNInvoiceData,
  OrderItemPayload,
  PaymentMethod,
  StorePayInvoiceData,
};

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  invoiceData: QPayInvoiceData | null;
  lendmnInvoiceData: LendMNInvoiceData | null;
  storepayInvoiceData: StorePayInvoiceData | null;
  paymentMethod: PaymentMethod;
  isCreating: boolean;
  createError: string | null;
  orderItems: OrderItemPayload[];
  orderNumber: string | null;
  orderId: string | null;
  phoneNumber?: string;
  couponId?: string | null;
  couponDiscount?: number;
  pointsUsed?: number;
  pointDiscount?: number;
  onPaymentSuccess: () => void;
  onLendMNSelect?: () => void;
  onStorePaySelect?: () => void;
  onTransferSelect?: () => void;
  onQPayReselect?: () => void;
}

function LoadingSpinner({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      className="animate-spin"
    >
      <path
        d="M10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18C14.4183 18 18 14.4183 18 10"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PaymentModal({
  isOpen,
  onClose,
  totalAmount,
  invoiceData,
  lendmnInvoiceData,
  storepayInvoiceData,
  paymentMethod,
  isCreating,
  createError,
  orderItems,
  orderNumber,
  orderId,
  phoneNumber,
  couponId,
  couponDiscount,
  pointsUsed,
  pointDiscount,
  onPaymentSuccess,
  onLendMNSelect,
  onStorePaySelect,
  onTransferSelect,
  onQPayReselect,
}: PaymentModalProps) {
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [activeTab, setActiveTab] = useState<"qr" | "bank">("qr");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [transferSubmitted, setTransferSubmitted] = useState(false);

  const {
    hasInvoice,
    paid,
    manualCheck: handleManualCheck,
    checking,
    checkFailed,
    checkError,
  } = usePaymentPolling({
    isOpen,
    paymentMethod,
    invoiceData,
    lendmnInvoiceData,
    storepayInvoiceData,
    orderId,
    orderItems,
    totalAmount,
    couponId,
    couponDiscount,
    pointsUsed,
    pointDiscount,
    onPaymentSuccess,
  });

  useScrollLock(visible);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setTransferSubmitted(false);
      // Desktop: QR tab default, Mobile: Bank app tab default
      const isMobile = window.innerWidth < 768;
      setActiveTab(isMobile ? "bank" : "qr");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimate(true);
        });
      });
    } else {
      setAnimate(false);
      const timeout = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !showSuccess) onClose();
    };

    if (visible) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [visible, onClose, paid]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!visible || typeof window === "undefined") return null;

  // Mobile success modal (centered like desktop)
  const showSuccess = paid || transferSubmitted;

  const mobileSuccessModal = showSuccess ? (
    <div
      className="fixed inset-0 z-999 flex items-center justify-center md:hidden"
      style={{ opacity: animate ? 1 : 0 }}
    >
      <div
        className="absolute inset-0 bg-[rgba(2,6,23,0.30)] transition-opacity duration-200 touch-none"
        aria-hidden="true"
      />
      <div
        className="relative w-full max-w-[375px] mx-4 bg-white border border-[#E2E8F0] rounded-[10px] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.10),0_4px_6px_-4px_rgba(0,0,0,0.10)] p-6 flex flex-col gap-6 transition-all duration-200"
        style={{
          opacity: animate ? 1 : 0,
          transform: animate ? "scale(1)" : "scale(0.95)",
        }}
      >
        <div className="flex flex-col items-center justify-center gap-8">
          <div className={`w-[56px] h-[56px] ${transferSubmitted ? "bg-[#F59E0B]" : "bg-[#14B8A6]"} rounded-full flex items-center justify-center`}>
            <Success />
          </div>
          <div className="flex flex-col items-center gap-2">
            <PrimaryHeading>
              {transferSubmitted ? "Захиалга бүртгэгдлээ" : "Захиалга баталгаажлаа"}
            </PrimaryHeading>
            <p className="text-[#64748B] font-normal text-base font-manrope text-center">
              {transferSubmitted
                ? "Төлбөр төлснөөс хойш 2-4 цагийн дотор захиалга баталгаажна"
                : "Та захиалгаа профайл цэснээс хянах боломжтой"}
            </p>
          </div>
          <div className="flex gap-[10px] w-full">
            <Link
              href="/profile"
              prefetch={true}
              className="flex w-full items-center justify-center px-3 py-2.5 h-11 border border-[#E2E8F0] rounded-sm cursor-pointer text-[#020617] font-normal text-base font-manrope hover:bg-[#F8FAFC] transition-colors duration-200"
            >
              Захиалгаа харах
            </Link>
            <Link
              href="/products"
              prefetch={true}
              className="flex w-full items-center justify-center px-3 py-2.5 h-11 bg-[#020617] rounded-sm cursor-pointer text-white font-normal text-base font-manrope hover:bg-[#1E293B] transition-colors duration-200"
            >
              Дэлгүүр хэсэх
            </Link>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  // Mobile full screen content (drawer for payment flow, not shown when success)
  const mobileContent = !showSuccess ? (
    <div
      className="fixed inset-0 z-999 flex flex-col md:hidden"
      style={{ opacity: animate ? 1 : 0 }}
    >
      <div
        className="absolute inset-0 bg-[rgba(2,6,23,0.30)] transition-opacity duration-200 touch-none"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="relative mt-auto bg-white rounded-t-[10px] flex flex-col h-[90vh] transition-transform duration-200"
        style={{
          transform: animate ? "translateY(0)" : "translateY(100%)",
        }}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#E2E8F0]">
          <PrimaryHeading>
            Төлбөр төлөх
          </PrimaryHeading>
          <button
            onClick={onClose}
            className="p-1 cursor-pointer"
            aria-label="Close"
          >
            <Cancel />
          </button>
        </div>

        {/* Mobile Body */}
        <div className="flex-1 overflow-y-auto overscroll-y-contain">
          {checkFailed && (
            <div className="mx-4 mt-4 border border-[#E2E8F0] bg-[#FFF1F2] rounded-[10px] flex items-start px-4 py-3 gap-3">
              <AlertCircle color="#DC2626" size={16} />
              <div className="flex flex-col gap-0.5">
                <p className="text-[#DC2626] font-medium text-sm font-manrope">
                  {checkError
                    ? "Төлбөр шалгахад алдаа гарлаа"
                    : "Төлбөр төлөгдсөн мэдээлэл ирсэнгүй"}
                </p>
                <p className="text-[#DC2626] font-normal text-sm font-manrope">
                  {checkError
                    ? checkError
                    : "Банкнаас төлбөр төлөгдсөн мэдээлэл ирсэнгүй. Та түр хүлээгээд дахин оролдоно уу!"}
                </p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isCreating && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-12 h-12 rounded-full bg-[#F1F5F9] flex items-center justify-center">
                <Spinner size="sm" />
              </div>
              <MutedMediumSm>
                Нэхэмжлэл үүсгэж байна...
              </MutedMediumSm>
            </div>
          )}

          {/* Error State */}
          {createError && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-12 h-12 rounded-full bg-[#FEF2F2] flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 9V13M12 17H12.01M12 3L2 21H22L12 3Z"
                    stroke="#EF4444"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-[#EF4444] font-medium text-sm font-manrope text-center">
                {createError}
              </p>
              <button
                onClick={onClose}
                className="text-[#64748B] font-medium text-sm font-manrope underline cursor-pointer"
              >
                Хаах
              </button>
            </div>
          )}

          {/* LendMN Invoice Ready - Mobile */}
          {paymentMethod === "lendmn" &&
            lendmnInvoiceData &&
            !isCreating &&
            !createError &&
            !showSuccess && (
              <div className="flex flex-col gap-3 p-4">
                <BankField
                  label="Нэхэмжлэлийн дугаар"
                  value={lendmnInvoiceData.invoiceNumber}
                  copyable
                  onCopy={() =>
                    handleCopy(lendmnInvoiceData.invoiceNumber, "lendmnInvoice")
                  }
                  copied={copiedField === "lendmnInvoice"}
                />
                {phoneNumber && (
                  <BankField label="Утасны дугаар" value={phoneNumber} />
                )}
                <BankField
                  label="Төлөх дүн"
                  value={`${formatPrice(totalAmount)}₮`}
                  copyable
                  onCopy={() => handleCopy(String(totalAmount), "amount")}
                  copied={copiedField === "amount"}
                />
                {orderNumber && (
                  <BankField
                    label="Захиалгын дугаар"
                    value={orderNumber}
                    copyable
                    onCopy={() => handleCopy(orderNumber, "order")}
                    copied={copiedField === "order"}
                    semibold
                  />
                )}

                <div className="py-2">
                  <div className="h-px bg-[#E2E8F0]" />
                </div>

                <div className="bg-[#FFFBEB] rounded-[10px] px-4 py-4 flex items-start gap-2.5">
                  <div className="shrink-0 mt-0.5">
                    <Payment />
                  </div>
                  <PrimaryMediumSm>
                    LendMN апп дээр нэхэмжлэлийг баталгаажуулна уу. Тусламж:
                    7771-0990, 88900900
                  </PrimaryMediumSm>
                </div>
              </div>
            )}

          {/* StorePay Invoice Ready - Mobile */}
          {paymentMethod === "storepay" &&
            storepayInvoiceData &&
            !isCreating &&
            !createError &&
            !showSuccess && (
              <div className="flex flex-col gap-3 p-4">
                {phoneNumber && (
                  <BankField label="Утасны дугаар" value={phoneNumber} />
                )}
                <BankField
                  label="Төлөх дүн"
                  value={`${formatPrice(totalAmount)}₮`}
                  copyable
                  onCopy={() => handleCopy(String(totalAmount), "amount")}
                  copied={copiedField === "amount"}
                />
                {orderNumber && (
                  <BankField
                    label="Захиалгын дугаар"
                    value={orderNumber}
                    copyable
                    onCopy={() => handleCopy(orderNumber, "order")}
                    copied={copiedField === "order"}
                    semibold
                  />
                )}

                <div className="py-2">
                  <div className="h-px bg-[#E2E8F0]" />
                </div>

                <div className="bg-[#FFFBEB] rounded-[10px] px-4 py-4 flex items-start gap-2.5">
                  <div className="shrink-0 mt-0.5">
                    <Payment />
                  </div>
                  <PrimaryMediumSm>
                    StorePay апп дээр нэхэмжлэлийг баталгаажуулна уу.
                  </PrimaryMediumSm>
                </div>
              </div>
            )}

          {/* QPay/Transfer Invoice Ready - Mobile */}
          {(paymentMethod === "qpay" || paymentMethod === "transfer") &&
            invoiceData &&
            !isCreating &&
            !createError &&
            !showSuccess && (
              <>
                {/* Mobile Tabs */}
                <div className="flex border-b border-[#E2E8F0]">
                  <button
                    onClick={() => setActiveTab("bank")}
                    className={`flex-1 py-3 border-b-2 text-sm font-medium font-manrope cursor-pointer transition-colors duration-200 ${
                      activeTab === "bank"
                        ? "text-[#020617] border-[#020617]"
                        : "text-[#64748B] border-transparent"
                    }`}
                  >
                    Банк / ББС -ын апп
                  </button>
                  <button
                    onClick={() => setActiveTab("qr")}
                    className={`flex-1 py-3 border-b-2 text-sm font-medium font-manrope cursor-pointer transition-colors duration-200 ${
                      activeTab === "qr"
                        ? "text-[#020617] border-[#020617]"
                        : "text-[#64748B] border-transparent"
                    }`}
                  >
                    QR / Дансаар шилжүүлэх
                  </button>
                </div>

                {/* Mobile QR/Bank Transfer Tab */}
                {activeTab === "qr" && (
                  <div className="flex flex-col gap-3 p-4">
                    {/* QR view (default) */}
                    {paymentMethod === "qpay" && (
                      <>
                        <div className="flex flex-col items-center gap-2">
                          <PrimarySm>
                            QR код уншуулах
                          </PrimarySm>
                          <div className="w-[200px] h-[200px] bg-[#F1F5F9] flex items-center justify-center overflow-hidden rounded-lg">
                            {invoiceData.qr_image ? (
                              <img
                                src={`data:image/png;base64,${invoiceData.qr_image}`}
                                alt="QPay QR Code"
                                width={200}
                                height={200}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <p className="text-[#94A3B8] text-xs font-manrope">
                                QR код байхгүй
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={onTransferSelect}
                          className="w-full px-3 py-2.5 mt-1 border border-[#E2E8F0] rounded-lg cursor-pointer hover:bg-[#F8FAFC] transition-colors duration-200 text-[#020617] font-medium text-sm font-manrope"
                        >
                          Дансаар шилжүүлэх
                        </button>
                      </>
                    )}

                    {/* Bank transfer view */}
                    {paymentMethod === "transfer" && (
                      <>
                        <BankField
                          label="Банк"
                          value={process.env.NEXT_PUBLIC_QUICKPAY_BANK_NAME || ""}
                        />
                        <BankField
                          label="Данс эзэмшигч"
                          value={
                            process.env.NEXT_PUBLIC_QUICKPAY_ACCOUNT_NAME || ""
                          }
                          copyable
                          onCopy={() =>
                            handleCopy(
                              process.env.NEXT_PUBLIC_QUICKPAY_ACCOUNT_NAME || "",
                              "owner",
                            )
                          }
                          copied={copiedField === "owner"}
                        />
                        <BankField
                          label="Дансы дугаар"
                          value={
                            process.env.NEXT_PUBLIC_QUICKPAY_ACCOUNT_NUMBER || ""
                          }
                          copyable
                          onCopy={() =>
                            handleCopy(
                              process.env.NEXT_PUBLIC_QUICKPAY_ACCOUNT_NUMBER || "",
                              "bankNumber",
                            )
                          }
                          copied={copiedField === "bankNumber"}
                        />
                        <BankField
                          label="Төлөх дүн"
                          value={`${formatPrice(totalAmount)}₮`}
                          copyable
                          onCopy={() => handleCopy(String(totalAmount), "amount")}
                          copied={copiedField === "amount"}
                        />
                        {orderNumber && (
                          <BankField
                            label="Гүйлгээний утга"
                            value={orderNumber}
                            copyable
                            onCopy={() => handleCopy(orderNumber, "order")}
                            copied={copiedField === "order"}
                            semibold
                          />
                        )}

                        <div className="bg-[#FFFBEB] rounded-[10px] px-3 py-3 flex items-start gap-2.5 mt-1">
                          <div className="shrink-0 mt-0.5">
                            <Payment />
                          </div>
                          <p className="text-[#020617] font-medium text-xs font-manrope leading-5">
                            Гүйлгээний утга дээрх захиалгын дугаарыг заавал бичнэ
                            үү! Төлбөр төлснөөс хойш 2-4 цагийн дотор захиалга
                            баталгаажна.
                            <br />
                            Тусламж: 7771-0990, 88900900
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            setTransferSubmitted(true);
                            onPaymentSuccess();
                          }}
                          className="w-full px-3 py-2.5 mt-1 bg-[#020617] rounded-lg cursor-pointer hover:bg-[#1E293B] transition-colors duration-200 text-white font-medium text-sm font-manrope"
                        >
                          Төлсөн бол дар
                        </button>

                        <button
                          onClick={onQPayReselect}
                          className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg cursor-pointer hover:bg-[#F8FAFC] transition-colors duration-200 text-[#020617] font-medium text-sm font-manrope"
                        >
                          QR код уншуулах
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Mobile Bank App Tab */}
                {activeTab === "bank" && (
                  <div className="flex flex-col gap-5 p-4">
                    {invoiceData.urls && invoiceData.urls.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <p className="text-[#020617] font-bold text-sm font-manrope">
                          Банк, хэтэвч
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          {invoiceData.urls
                            .filter(
                              (bank) =>
                                ![
                                  "storepay",
                                  "pocket",
                                  "ard",
                                  "simple",
                                  "leasing",
                                  "lend",
                                ].some((name) =>
                                  bank.name.toLowerCase().includes(name),
                                ),
                            )
                            .map((bank, index) => (
                              <BankAppCard
                                key={index}
                                bank={bank}
                                description={getBankDescription(bank.name)}
                              />
                            ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-2">
                      <p className="text-[#020617] font-bold text-sm font-manrope">
                        Хуваах төлөх
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {invoiceData.urls
                          ?.filter((bank) =>
                            [
                              "storepay",
                              "pocket",
                              "ard",
                              "simple",
                              "leasing",
                            ].some((name) =>
                              bank.name.toLowerCase().includes(name),
                            ),
                          )
                          .map((bank, index) => (
                            <BankAppCard
                              key={index}
                              bank={bank}
                              description={getBankDescription(bank.name)}
                            />
                          ))}

                        <button
                          onClick={onLendMNSelect}
                          className="flex items-center gap-2.5 p-2 bg-white border border-[#E2E8F0] rounded-2xl hover:border-[#CBD5E1] transition-colors cursor-pointer text-left"
                        >
                          <img
                            src="/lend-logo.png"
                            alt="LendMN"
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-lg border border-[#E2E8F0] object-contain shrink-0"
                          />
                          <div className="flex flex-col min-w-0">
                            <PrimarySm>
                              LendMN
                            </PrimarySm>
                            <MutedTextXs>
                              Хуваах төлөх
                            </MutedTextXs>
                          </div>
                        </button>

                        <button
                          onClick={
                            totalAmount >= STOREPAY_MIN_AMOUNT
                              ? onStorePaySelect
                              : undefined
                          }
                          disabled={totalAmount < STOREPAY_MIN_AMOUNT}
                          className={`flex items-center gap-2.5 p-2 bg-white border border-[#E2E8F0] rounded-2xl transition-colors text-left ${totalAmount >= STOREPAY_MIN_AMOUNT ? "hover:border-[#CBD5E1] cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
                        >
                          <img
                            src="/storepay.png"
                            alt="StorePay"
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-lg border border-[#E2E8F0] object-contain shrink-0"
                          />
                          <div className="flex flex-col min-w-0">
                            <PrimarySm>
                              StorePay
                            </PrimarySm>
                            <p
                              className={`font-normal text-xs font-manrope ${totalAmount < STOREPAY_MIN_AMOUNT ? "text-red-500" : "text-[#64748B]"}`}
                            >
                              {totalAmount < STOREPAY_MIN_AMOUNT
                                ? `${STOREPAY_MIN_AMOUNT.toLocaleString()}₮-с дээш`
                                : "Хуваарь төлөлт"}
                            </p>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
        </div>

        {/* Mobile Footer Button — hide for bank transfer */}
        {!isCreating && !createError && hasInvoice && paymentMethod !== "transfer" && (
          <div className="p-4 border-t border-[#E2E8F0]">
            <button
              onClick={handleManualCheck}
              disabled={checking}
              className="w-full px-3 py-3 bg-[#020617] rounded-lg cursor-pointer hover:bg-[#1E293B] transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checking ? (
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium text-base font-manrope">
                    Төлбөр шалгах
                  </span>
                  <LoadingSpinner />
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-white font-medium text-base font-manrope">
                    Төлбөр шалгах
                  </span>
                  <Reload />
                </div>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  ) : null;

  // Desktop modal content
  const desktopContent = (
    <div className="fixed inset-0 z-999 hidden md:flex items-center justify-center">
      <div
        className="absolute inset-0 bg-[rgba(2,6,23,0.30)] transition-opacity duration-200"
        style={{ opacity: animate ? 1 : 0 }}
        onClick={showSuccess ? undefined : onClose}
        aria-hidden="true"
      />

      <div
        className={`relative w-full ${showSuccess ? "max-w-[375px]" : "max-w-[600px]"} max-h-[90vh] bg-white border border-[#E2E8F0] rounded-[10px] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.10),0_4px_6px_-4px_rgba(0,0,0,0.10)] p-6 flex flex-col gap-6 transition-all duration-200 overflow-y-auto`}
        style={{
          opacity: animate ? 1 : 0,
          transform: animate ? "scale(1)" : "scale(0.95)",
        }}
      >
        {/* Header */}
        {!showSuccess && (
          <div className="flex items-center justify-between">
            <PrimaryHeading>
              Төлбөр төлөх
            </PrimaryHeading>
            <button
              onClick={onClose}
              className="p-1 cursor-pointer"
              aria-label="Close"
            >
              <Cancel />
            </button>
          </div>
        )}

        {checkFailed && !showSuccess && (
          <div className="border border-[#E2E8F0] bg-[#FFF1F2] rounded-[10px] flex items-start px-4 py-3 gap-3">
            <AlertCircle color="#DC2626" size={16} />
            <div className="flex flex-col gap-0.5">
              <p className="text-[#DC2626] font-medium text-sm font-manrope">
                {checkError
                  ? "Төлбөр шалгахад алдаа гарлаа"
                  : "Төлбөр төлөгдсөн мэдээлэл ирсэнгүй"}
              </p>
              <p className="text-[#DC2626] font-normal text-sm font-manrope">
                {checkError
                  ? checkError
                  : "Банкнаас төлбөр төлөгдсөн мэдээлэл ирсэнгүй. Та түр хүлээгээд дахин оролдоно уу!"}
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-5">
          {/* Loading State */}
          {isCreating && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-12 h-12 rounded-full bg-[#F1F5F9] flex items-center justify-center">
                <Spinner size="sm" />
              </div>
              <MutedMediumSm>
                Нэхэмжлэл үүсгэж байна...
              </MutedMediumSm>
            </div>
          )}

          {/* Error State */}
          {createError && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-12 h-12 rounded-full bg-[#FEF2F2] flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 9V13M12 17H12.01M12 3L2 21H22L12 3Z"
                    stroke="#EF4444"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-[#EF4444] font-medium text-sm font-manrope text-center">
                {createError}
              </p>
              <button
                onClick={onClose}
                className="text-[#64748B] font-medium text-sm font-manrope underline cursor-pointer"
              >
                Хаах
              </button>
            </div>
          )}

          {/* Payment Success State */}
          {showSuccess && (
            <div className="flex flex-col items-center justify-center gap-8">
              <div className={`w-[56px] h-[56px] ${transferSubmitted ? "bg-[#F59E0B]" : "bg-[#14B8A6]"} rounded-full flex items-center justify-center`}>
                <Success />
              </div>
              <div className="flex flex-col items-center gap-2">
                <PrimaryHeading>
                  {transferSubmitted ? "Захиалга бүртгэгдлээ" : "Захиалга баталгаажлаа"}
                </PrimaryHeading>
                <p className="text-[#64748B] font-normal text-base font-manrope text-center">
                  {transferSubmitted
                    ? "Төлбөр төлснөөс хойш 2-4 цагийн дотор захиалга баталгаажна"
                    : "Та захиалгаа профайл цэснээс хянах боломжтой"}
                </p>
              </div>
              <div className="flex gap-[10px] w-full">
                <Link
                  href="/profile"
                  prefetch={true}
                  className="flex w-full items-center justify-center px-3 py-2.5 h-11 border border-[#E2E8F0] rounded-sm cursor-pointer text-[#020617] font-normal text-base font-manrope hover:bg-[#F8FAFC] transition-colors duration-200"
                >
                  Захиалгаа харах
                </Link>
                <Link
                  href="/products"
                  prefetch={true}
                  className="flex w-full items-center justify-center px-3 py-2.5 h-11 bg-[#020617] rounded-sm cursor-pointer text-white font-normal text-base font-manrope hover:bg-[#1E293B] transition-colors duration-200"
                >
                  Дэлгүүр хэсэх
                </Link>
              </div>
            </div>
          )}

          {/* LendMN Invoice Ready */}
          {paymentMethod === "lendmn" &&
            lendmnInvoiceData &&
            !isCreating &&
            !createError &&
            !showSuccess && (
              <div className="flex flex-col gap-3 px-4 pb-3">
                <BankField
                  label="Нэхэмжлэлийн дугаар"
                  value={lendmnInvoiceData.invoiceNumber}
                  copyable
                  onCopy={() =>
                    handleCopy(lendmnInvoiceData.invoiceNumber, "lendmnInvoice")
                  }
                  copied={copiedField === "lendmnInvoice"}
                />
                {phoneNumber && (
                  <BankField label="Утасны дугаар" value={phoneNumber} />
                )}
                <BankField
                  label="Төлөх дүн"
                  value={`${formatPrice(totalAmount)}₮`}
                  copyable
                  onCopy={() => handleCopy(String(totalAmount), "amount")}
                  copied={copiedField === "amount"}
                />
                {orderNumber && (
                  <BankField
                    label="Захиалгын дугаар"
                    value={orderNumber}
                    copyable
                    onCopy={() => handleCopy(orderNumber, "order")}
                    copied={copiedField === "order"}
                    semibold
                  />
                )}

                {/* Divider */}
                <div className="py-2">
                  <div className="h-px bg-[#E2E8F0]" />
                </div>

                {/* Info box */}
                <div className="bg-[#FFFBEB] rounded-[10px] px-4 py-4 flex items-start gap-2.5">
                  <div className="shrink-0 mt-0.5">
                    <Payment />
                  </div>
                  <PrimaryMediumSm>
                    LendMN апп дээр нэхэмжлэлийг баталгаажуулна уу. Тусламж:
                    7771-0990, 88900900
                  </PrimaryMediumSm>
                </div>

                <button
                  onClick={handleManualCheck}
                  disabled={checking}
                  className="w-full px-3 py-2.5 mt-1.5 bg-[#020617] rounded-sm cursor-pointer hover:bg-[#1E293B] transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checking ? (
                    <div className="flex items-center gap-1">
                      <span className="text-white font-normal text-base font-manrope">
                        Шалгаж байна...
                      </span>
                      <LoadingSpinner />
                    </div>
                  ) : (
                    <div className="flex items-center gap-0.5">
                      <span className="px-0.5 text-white font-normal text-base font-manrope">
                        Төлбөр шалгах
                      </span>
                      <Reload />
                    </div>
                  )}
                </button>
              </div>
            )}

          {/* StorePay Invoice Ready */}
          {paymentMethod === "storepay" &&
            storepayInvoiceData &&
            !isCreating &&
            !createError &&
            !showSuccess && (
              <div className="flex flex-col gap-3 px-4 pb-3">
                {phoneNumber && (
                  <BankField label="Утасны дугаар" value={phoneNumber} />
                )}
                <BankField
                  label="Төлөх дүн"
                  value={`${formatPrice(totalAmount)}₮`}
                  copyable
                  onCopy={() => handleCopy(String(totalAmount), "amount")}
                  copied={copiedField === "amount"}
                />
                {orderNumber && (
                  <BankField
                    label="Захиалгын дугаар"
                    value={orderNumber}
                    copyable
                    onCopy={() => handleCopy(orderNumber, "order")}
                    copied={copiedField === "order"}
                    semibold
                  />
                )}

                <div className="py-2">
                  <div className="h-px bg-[#E2E8F0]" />
                </div>

                <div className="bg-[#FFFBEB] rounded-[10px] px-4 py-4 flex items-start gap-2.5">
                  <div className="shrink-0 mt-0.5">
                    <Payment />
                  </div>
                  <PrimaryMediumSm>
                    StorePay апп дээр нэхэмжлэлийг баталгаажуулна уу.
                  </PrimaryMediumSm>
                </div>

                <button
                  onClick={handleManualCheck}
                  disabled={checking}
                  className="w-full px-3 py-2.5 mt-1.5 bg-[#020617] rounded-sm cursor-pointer hover:bg-[#1E293B] transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checking ? (
                    <div className="flex items-center gap-1">
                      <span className="text-white font-normal text-base font-manrope">
                        Шалгаж байна...
                      </span>
                      <LoadingSpinner />
                    </div>
                  ) : (
                    <div className="flex items-center gap-0.5">
                      <span className="px-0.5 text-white font-normal text-base font-manrope">
                        Төлбөр шалгах
                      </span>
                      <Reload />
                    </div>
                  )}
                </button>
              </div>
            )}

          {/* QPay/Transfer Invoice Ready — Show QR & Bank Links */}
          {(paymentMethod === "qpay" || paymentMethod === "transfer") &&
            invoiceData &&
            !isCreating &&
            !createError &&
            !showSuccess && (
              <>
                {/* Tabs */}
                <div className="flex border-b border-[#E2E8F0]">
                  <button
                    onClick={() => setActiveTab("qr")}
                    className={`flex-1 py-3 border-b-2 text-base font-medium font-manrope cursor-pointer transition-colors duration-200 ${
                      activeTab === "qr"
                        ? "text-[#020617] border-[#020617]"
                        : "text-[#64748B] border-transparent"
                    }`}
                  >
                    QR / Дансаар шилжүүлэх
                  </button>
                  <button
                    onClick={() => setActiveTab("bank")}
                    className={`flex-1 py-3 border-b-2 text-base font-medium font-manrope cursor-pointer transition-colors duration-200 ${
                      activeTab === "bank"
                        ? "text-[#020617] border-[#020617]"
                        : "text-[#64748B] border-transparent"
                    }`}
                  >
                    Банк / ББС -ын апп
                  </button>
                </div>

                {/* Tab Content */}
                {activeTab === "qr" && (
                  <div>
                    {/* QR view (default) */}
                    {paymentMethod === "qpay" && (
                      <div className="flex flex-col items-center gap-4 py-4">
                        <PrimarySm>
                          QR код уншуулах
                        </PrimarySm>
                        <div className="w-[230px] h-[230px] bg-[#F1F5F9] flex items-center justify-center overflow-hidden">
                          {invoiceData.qr_image ? (
                            <img
                              src={`data:image/png;base64,${invoiceData.qr_image}`}
                              alt="QPay QR Code"
                              width={230}
                              height={230}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <p className="text-[#94A3B8] text-xs font-manrope">
                              QR код байхгүй
                            </p>
                          )}
                        </div>

                        <button
                          onClick={handleManualCheck}
                          disabled={checking}
                          className="w-full px-3 py-2.5 bg-[#020617] rounded-sm cursor-pointer hover:bg-[#1E293B] transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {checking ? (
                            <div className="flex items-center gap-1">
                              <span className="text-white font-normal text-base font-manrope">
                                Шалгаж байна...
                              </span>
                              <LoadingSpinner />
                            </div>
                          ) : (
                            <div className="flex items-center gap-0.5">
                              <span className="px-0.5 text-white font-normal text-base font-manrope">
                                Төлбөр шалгах
                              </span>
                              <Reload />
                            </div>
                          )}
                        </button>

                        <button
                          onClick={onTransferSelect}
                          className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-sm cursor-pointer hover:bg-[#F8FAFC] transition-colors duration-200 text-[#020617] font-medium text-sm font-manrope"
                        >
                          Дансаар шилжүүлэх
                        </button>
                      </div>
                    )}

                    {/* Bank transfer view */}
                    {paymentMethod === "transfer" && (
                      <div className="flex flex-col gap-3 px-4 py-4">
                        <BankField
                          label="Банк"
                          value={
                            process.env.NEXT_PUBLIC_QUICKPAY_BANK_NAME || ""
                          }
                        />
                        <BankField
                          label="Данс эзэмшигч"
                          value={
                            process.env.NEXT_PUBLIC_QUICKPAY_ACCOUNT_NAME || ""
                          }
                          copyable
                          onCopy={() =>
                            handleCopy(
                              process.env.NEXT_PUBLIC_QUICKPAY_ACCOUNT_NAME ||
                                "",
                              "owner",
                            )
                          }
                          copied={copiedField === "owner"}
                        />
                        <BankField
                          label="Дансы дугаар"
                          value={
                            process.env.NEXT_PUBLIC_QUICKPAY_ACCOUNT_NUMBER ||
                            ""
                          }
                          copyable
                          onCopy={() =>
                            handleCopy(
                              process.env.NEXT_PUBLIC_QUICKPAY_ACCOUNT_NUMBER ||
                                "",
                              "bankNumber",
                            )
                          }
                          copied={copiedField === "bankNumber"}
                        />
                        <BankField
                          label="Төлөх дүн"
                          value={`${formatPrice(totalAmount)}₮`}
                          copyable
                          onCopy={() =>
                            handleCopy(String(totalAmount), "amount")
                          }
                          copied={copiedField === "amount"}
                        />
                        {orderNumber && (
                          <BankField
                            label="Гүйлгээний утга"
                            value={orderNumber}
                            copyable
                            onCopy={() => handleCopy(orderNumber, "order")}
                            copied={copiedField === "order"}
                            semibold
                          />
                        )}

                        <div className="bg-[#FFFBEB] rounded-[10px] px-4 py-4 flex items-start gap-2.5 mt-1">
                          <div className="shrink-0 mt-0.5">
                            <Payment />
                          </div>
                          <PrimaryMediumSm>
                            Гүйлгээний утга дээрх захиалгын дугаарыг заавал
                            бичнэ үү! Төлбөр төлснөөс хойш 2-4 цагийн дотор
                            захиалга баталгаажна. Тусламж: 7771-0990, 88900900
                          </PrimaryMediumSm>
                        </div>

                        <button
                          onClick={() => {
                            setTransferSubmitted(true);
                            onPaymentSuccess();
                          }}
                          className="w-full px-3 py-2.5 mt-1 bg-[#020617] rounded-sm cursor-pointer hover:bg-[#1E293B] transition-colors duration-200 text-white font-medium text-sm font-manrope"
                        >
                          Төлсөн бол дар
                        </button>

                        <button
                          onClick={onQPayReselect}
                          className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-sm cursor-pointer hover:bg-[#F8FAFC] transition-colors duration-200 text-[#020617] font-medium text-sm font-manrope"
                        >
                          QR код уншуулах
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Bank App Tab */}
                {activeTab === "bank" && (
                  <div className="flex flex-col gap-5">
                    {/* Desktop: Hide generic bank apps as they are mostly deep links. Only show LendMN which has a specific flow. */}
                    <div className="flex flex-col gap-2">
                      <p className="text-[#020617] font-bold text-sm font-manrope">
                        Хуваах төлөх
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {/* LendMN button */}
                        <button
                          onClick={onLendMNSelect}
                          className="flex items-center gap-2.5 p-2 bg-white border border-[#E2E8F0] rounded-2xl hover:border-[#CBD5E1] transition-colors cursor-pointer text-left"
                        >
                          <img
                            src="/lend-logo.png"
                            alt="LendMN"
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-lg border border-[#E2E8F0] object-contain shrink-0"
                          />
                          <div className="flex flex-col min-w-0">
                            <PrimarySm>
                              LendMN
                            </PrimarySm>
                            <MutedTextXs>
                              Хуваах төлөх
                            </MutedTextXs>
                          </div>
                        </button>

                        {/* StorePay button */}
                        <button
                          onClick={
                            totalAmount >= STOREPAY_MIN_AMOUNT
                              ? onStorePaySelect
                              : undefined
                          }
                          disabled={totalAmount < STOREPAY_MIN_AMOUNT}
                          className={`flex items-center gap-2.5 p-2 bg-white border border-[#E2E8F0] rounded-2xl transition-colors text-left ${totalAmount >= STOREPAY_MIN_AMOUNT ? "hover:border-[#CBD5E1] cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
                        >
                          <img
                            src="/storepay.png"
                            alt="StorePay"
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-lg border border-[#E2E8F0] object-contain shrink-0"
                          />
                          <div className="flex flex-col min-w-0">
                            <PrimarySm>
                              StorePay
                            </PrimarySm>
                            <p
                              className={`font-normal text-xs font-manrope ${totalAmount < STOREPAY_MIN_AMOUNT ? "text-red-500" : "text-[#64748B]"}`}
                            >
                              {totalAmount < STOREPAY_MIN_AMOUNT
                                ? `${STOREPAY_MIN_AMOUNT.toLocaleString()}₮-с дээш`
                                : "Хуваарь төлөлт"}
                            </p>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
        </div>
      </div>
    </div>
  );

  return createPortal(
    <>
      {mobileSuccessModal}
      {mobileContent}
      {desktopContent}
    </>,
    document.body,
  );
}

