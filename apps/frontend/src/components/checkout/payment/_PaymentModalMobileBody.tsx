"use client";

import { AlertCircle } from "lucide-react";

import { Spinner } from "@/components/ui/Spinner";
import { MutedMediumSm } from "@/components/ui/typography";

import { MobileBankAppTab } from "./_MobileBankAppTab";
import { MobileLendMNSection } from "./_MobileLendMNSection";
import { MobileQPayQRPanel } from "./_MobileQPayQRPanel";
import { MobileStorePaySection } from "./_MobileStorePaySection";
import { MobileTransferPanel } from "./_MobileTransferPanel";

import type { PaymentModalViewProps } from "./PaymentModalShared";

function ErrorBanner({
  checkFailed,
  checkError,
}: {
  checkFailed: boolean;
  checkError: string | null;
}) {
  if (!checkFailed) return null;
  return (
    <div className="mx-4 mt-4 border border-border bg-status-error-bg rounded-[10px] flex items-start px-4 py-3 gap-3">
      <AlertCircle color="#DC2626" size={16} />
      <div className="flex flex-col gap-0.5">
        <p className="text-red-600 font-medium text-sm font-manrope">
          {checkError ? "Төлбөр шалгахад алдаа гарлаа" : "Төлбөр төлөгдсөн мэдээлэл ирсэнгүй"}
        </p>
        <p className="text-red-600 font-normal text-sm font-manrope">
          {checkError
            ? checkError
            : "Банкнаас төлбөр төлөгдсөн мэдээлэл ирсэнгүй. Та түр хүлээгээд дахин оролдоно уу!"}
        </p>
      </div>
    </div>
  );
}

function CreatingState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <div className="w-12 h-12 rounded-full bg-border-light flex items-center justify-center">
        <Spinner size="sm" />
      </div>
      <MutedMediumSm>Нэхэмжлэл үүсгэж байна...</MutedMediumSm>
    </div>
  );
}

function CreateErrorState({ createError, onClose }: { createError: string; onClose: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
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
      <p className="text-red-500 font-medium text-sm font-manrope text-center">{createError}</p>
      <button
        onClick={onClose}
        className="text-text-secondary font-medium text-sm font-manrope underline cursor-pointer"
      >
        Хаах
      </button>
    </div>
  );
}

function MobileQPayTransferTabs({ view }: { view: PaymentModalViewProps }) {
  if (!view.invoiceData) return null;

  return (
    <>
      <div className="flex border-b border-border">
        <button
          onClick={() => view.setActiveTab("bank")}
          className={`flex-1 py-3 border-b-2 text-sm font-medium font-manrope cursor-pointer transition-colors duration-200 ${
            view.activeTab === "bank"
              ? "text-text-primary border-text-primary"
              : "text-text-secondary border-transparent"
          }`}
        >
          Банк / ББС -ын апп
        </button>
        <button
          onClick={() => view.setActiveTab("qr")}
          className={`flex-1 py-3 border-b-2 text-sm font-medium font-manrope cursor-pointer transition-colors duration-200 ${
            view.activeTab === "qr"
              ? "text-text-primary border-text-primary"
              : "text-text-secondary border-transparent"
          }`}
        >
          QR / Дансаар шилжүүлэх
        </button>
      </div>

      {view.activeTab === "qr" && (
        <div className="flex flex-col gap-3 p-4">
          {view.paymentMethod === "qpay" && (
            <MobileQPayQRPanel
              invoiceData={view.invoiceData}
              onTransferSelect={view.onTransferSelect}
            />
          )}
          {view.paymentMethod === "transfer" && (
            <MobileTransferPanel
              orderNumber={view.orderNumber}
              totalAmount={view.totalAmount}
              copiedField={view.copiedField}
              handleCopy={view.handleCopy}
              setTransferSubmitted={view.setTransferSubmitted}
              onPaymentSuccess={view.onPaymentSuccess}
              onQPayReselect={view.onQPayReselect}
            />
          )}
        </div>
      )}

      {view.activeTab === "bank" && (
        <MobileBankAppTab
          invoiceData={view.invoiceData}
          onLendMNSelect={view.onLendMNSelect}
          onStorePaySelect={view.onStorePaySelect}
          totalAmount={view.totalAmount}
        />
      )}
    </>
  );
}

export function PaymentModalMobileBody({ view }: { view: PaymentModalViewProps }) {
  if (view.isCreating) return <CreatingState />;
  if (view.createError) {
    return <CreateErrorState createError={view.createError} onClose={view.onClose} />;
  }

  const banner = <ErrorBanner checkFailed={view.checkFailed} checkError={view.checkError} />;

  if (view.paymentMethod === "lendmn" && view.lendmnInvoiceData) {
    return (
      <>
        {banner}
        <MobileLendMNSection
          lendmnInvoiceData={view.lendmnInvoiceData}
          phoneNumber={view.phoneNumber}
          orderNumber={view.orderNumber}
          totalAmount={view.totalAmount}
          copiedField={view.copiedField}
          handleCopy={view.handleCopy}
        />
      </>
    );
  }

  if (view.paymentMethod === "storepay" && view.storepayInvoiceData) {
    return (
      <>
        {banner}
        <MobileStorePaySection
          phoneNumber={view.phoneNumber}
          orderNumber={view.orderNumber}
          totalAmount={view.totalAmount}
          copiedField={view.copiedField}
          handleCopy={view.handleCopy}
        />
      </>
    );
  }

  if ((view.paymentMethod === "qpay" || view.paymentMethod === "transfer") && view.invoiceData) {
    return (
      <>
        {banner}
        <MobileQPayTransferTabs view={view} />
      </>
    );
  }

  return banner;
}
