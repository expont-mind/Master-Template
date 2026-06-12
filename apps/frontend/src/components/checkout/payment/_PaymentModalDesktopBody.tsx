"use client";

// Inner body of PaymentModalDesktop. Split out so the parent's render
// function stays under the complexity / max-lines-per-function limits.
// Handles the fan-out across payment methods + creating/error states.

import { PaymentBankAppTab, PaymentTabHeader } from "./_PaymentBankAppTab";
import { PaymentLendMNPanel } from "./_PaymentLendMNPanel";
import {
  InvoiceCreatingPanel,
  InvoiceErrorPanel,
  PaymentSuccessPanel,
} from "./_PaymentModalCommon";
import { PaymentQpayQrView, PaymentTransferView } from "./_PaymentQpayPanel";
import { PaymentStorePayPanel } from "./_PaymentStorePayPanel";

import type { PaymentModalViewProps } from "./PaymentModalShared";

export function PaymentModalDesktopBody({ view }: { view: PaymentModalViewProps }) {
  if (view.isCreating) return <InvoiceCreatingPanel />;
  if (view.createError) {
    return <InvoiceErrorPanel message={view.createError} onClose={view.onClose} />;
  }
  if (view.showSuccess) {
    return <PaymentSuccessPanel transferSubmitted={view.transferSubmitted} />;
  }

  const { paymentMethod } = view;

  if (paymentMethod === "lendmn" && view.lendmnInvoiceData) {
    return (
      <PaymentLendMNPanel
        data={view.lendmnInvoiceData}
        totalAmount={view.totalAmount}
        orderNumber={view.orderNumber}
        phoneNumber={view.phoneNumber}
        copiedField={view.copiedField}
        handleCopy={view.handleCopy}
        handleManualCheck={view.handleManualCheck}
        checking={view.checking}
      />
    );
  }

  if (paymentMethod === "storepay" && view.storepayInvoiceData) {
    return (
      <PaymentStorePayPanel
        totalAmount={view.totalAmount}
        orderNumber={view.orderNumber}
        phoneNumber={view.phoneNumber}
        copiedField={view.copiedField}
        handleCopy={view.handleCopy}
        handleManualCheck={view.handleManualCheck}
        checking={view.checking}
      />
    );
  }

  if ((paymentMethod === "qpay" || paymentMethod === "transfer") && view.invoiceData) {
    return <QPayOrTransferBody view={view} />;
  }

  return null;
}

function QPayOrTransferBody({ view }: { view: PaymentModalViewProps }) {
  return (
    <>
      <PaymentTabHeader activeTab={view.activeTab} setActiveTab={view.setActiveTab} />

      {view.activeTab === "qr" && <QrOrTransferTab view={view} />}

      {view.activeTab === "bank" && (
        <PaymentBankAppTab
          totalAmount={view.totalAmount}
          onLendMNSelect={view.onLendMNSelect}
          onStorePaySelect={view.onStorePaySelect}
        />
      )}
    </>
  );
}

function QrOrTransferTab({ view }: { view: PaymentModalViewProps }) {
  return (
    <div>
      {view.paymentMethod === "qpay" && view.invoiceData && (
        <PaymentQpayQrView
          invoiceData={view.invoiceData}
          handleManualCheck={view.handleManualCheck}
          checking={view.checking}
          onTransferSelect={() => view.onTransferSelect?.()}
        />
      )}

      {view.paymentMethod === "transfer" && (
        <PaymentTransferView
          totalAmount={view.totalAmount}
          orderNumber={view.orderNumber}
          copiedField={view.copiedField}
          handleCopy={view.handleCopy}
          onQPayReselect={() => view.onQPayReselect?.()}
          onTransferSubmit={() => {
            view.setTransferSubmitted(true);
            view.onPaymentSuccess();
          }}
        />
      )}
    </div>
  );
}
