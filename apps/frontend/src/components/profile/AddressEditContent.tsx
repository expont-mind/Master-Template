"use client";

import Link from "next/link";
import { useState } from "react";

import { AddressMultiStepModal } from "@/components/checkout/AddressMultiStepModal";
import { type ModalField } from "@/components/checkout/constants";
import { Slash } from "@/components/svg";

import { AddressFields } from "./_address-edit/_AddressFields";
import { useAddressForm } from "./_address-edit/_useAddressForm";

import type { Database } from "@/types/database";

type AddressRow = Database["public"]["Tables"]["addresses"]["Row"];

interface AddressEditContentProps {
  addressId?: string;
  existingAddress?: AddressRow;
  onBack: () => void;
  onSave: () => void;
}

function AddressBreadcrumb({ addressId }: { addressId?: string }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1.5 px-px md:px-0.5 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <div className="flex items-center gap-1.5 md:hidden">
          <Link
            href="/profile"
            className="text-slate-500 text-sm font-normal font-manrope hover:text-slate-700 transition-colors"
          >
            Профайл
          </Link>
          <Slash />
        </div>
        <Link
          href="/profile?tab=settings"
          className="text-slate-500 text-sm font-normal font-manrope hover:text-slate-700 transition-colors"
        >
          Тохиргоо
        </Link>
        <Slash />
        <Link
          href="/profile?tab=address"
          className="text-slate-500 text-sm font-normal font-manrope hover:text-slate-700 transition-colors"
        >
          Миний хаяг
        </Link>
        <Slash />
        <p className="text-slate-950 text-sm font-normal font-manrope">
          {addressId ? "Хаяг өөрчлөх" : "Хүргэх хаяг"}
        </p>
      </div>
      <p className="px-0 md:px-0.5 pb-0 md:pb-3 text-text-primary font-bold md:font-semibold text-2xl md:text-xl font-manrope">
        {addressId ? "Хаяг өөрчлөх" : "Хүргэх хаяг"}
      </p>
    </div>
  );
}

interface SubmitButtonProps {
  addressId?: string;
  canSave: boolean;
  hasChanges: boolean;
  saving: boolean;
  onSubmit: () => void;
}

function SubmitButton({ addressId, canSave, hasChanges, saving, onSubmit }: SubmitButtonProps) {
  const enabled = canSave && hasChanges && !saving;
  return (
    <div className="flex justify-end gap-[10px]">
      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSave || !hasChanges || saving}
        className={`w-fit px-3 py-2.5 rounded-sm font-medium text-base font-manrope transition-colors duration-200 ${
          enabled
            ? "bg-text-primary text-white cursor-pointer hover:bg-surface-dark"
            : "bg-overlay text-white cursor-not-allowed"
        }`}
      >
        <span className="px-0.5">
          {saving ? "Хадгалж байна..." : addressId ? "Өөрчлөх" : "Хадгалах"}
        </span>
      </button>
    </div>
  );
}

export const AddressEditContent = ({
  addressId,
  existingAddress,
  onBack,
  onSave,
}: AddressEditContentProps) => {
  const form = useAddressForm({ addressId, existingAddress, onSave, onBack });
  const [openModal, setOpenModal] = useState<ModalField>(null);

  return (
    <div className="flex flex-col gap-4 md:gap-2">
      <AddressBreadcrumb addressId={addressId} />

      <div className="flex flex-col gap-4 px-0.5">
        <AddressFields form={form} onOpenModal={setOpenModal} />
        <SubmitButton
          addressId={addressId}
          canSave={form.canSave}
          hasChanges={form.hasChanges}
          saving={form.saving}
          onSubmit={form.handleSubmit}
        />
      </div>

      <AddressMultiStepModal
        isOpen={openModal !== null}
        onClose={() => setOpenModal(null)}
        initialStep={openModal}
        city={form.city}
        setCity={form.setCity}
        district={form.district}
        setDistrict={form.setDistrict}
        khoroo={form.khoroo}
        setKhoroo={form.setKhoroo}
      />
    </div>
  );
};
