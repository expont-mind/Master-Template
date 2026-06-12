"use client";

import { createPortal } from "react-dom";

import { useScrollLock } from "@/lib/hooks/useScrollLock";

import { AddCouponInputView } from "./coupon/_AddCouponInputView";
import { AddCouponSuccessView } from "./coupon/_AddCouponSuccessView";
import { useAddCoupon } from "./coupon/_useAddCoupon";
import { useEscapeKey, useModalLifecycle } from "./point-activation/_useModalLifecycle";

interface AddCouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddCouponModal = ({ isOpen, onClose, onSuccess }: AddCouponModalProps) => {
  const noop = () => {};
  const { visible, animate } = useModalLifecycle(isOpen, noop, 200);
  const { code, loading, error, successInfo, handleSubmit, handleCodeChange } =
    useAddCoupon(isOpen);

  useScrollLock(visible);

  const handleSuccessClose = () => {
    onSuccess();
    onClose();
  };

  const dismiss = successInfo ? handleSuccessClose : onClose;
  useEscapeKey(visible, dismiss);

  if (!visible || typeof window === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-999 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-overlay transition-opacity duration-200"
        style={{ opacity: animate ? 1 : 0 }}
        onClick={dismiss}
        aria-hidden="true"
      />
      <div
        className="relative w-full max-w-[375px] bg-white border border-border rounded-[10px] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.10),0_4px_6px_-4px_rgba(0,0,0,0.10)] p-6 flex flex-col gap-6 transition-all duration-200 mx-4 md:mx-0"
        style={{
          opacity: animate ? 1 : 0,
          transform: animate ? "scale(1)" : "scale(0.95)",
        }}
      >
        {successInfo ? (
          <AddCouponSuccessView successInfo={successInfo} onClose={handleSuccessClose} />
        ) : (
          <AddCouponInputView
            code={code}
            error={error}
            loading={loading}
            onClose={onClose}
            onCodeChange={handleCodeChange}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>,
    document.body,
  );
};
