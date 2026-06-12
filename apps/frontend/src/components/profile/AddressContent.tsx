"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { Plus, LocationBig, Slash } from "@/components/svg";
import { MutedText } from "@/components/ui/typography";

import { deleteAddress, setDefaultAddress } from "./address/_addressMutations";
import { useDropdownClickAway } from "./address/_useDropdownClickAway";
import { AddressListItem } from "./address/AddressListItem";
import { DeleteModal } from "./DeleteModal";

import type { Database } from "@/types/database";

type AddressRow = Database["public"]["Tables"]["addresses"]["Row"];

interface AddressContentProps {
  addresses: AddressRow[];
  onEditAddress: (id: string) => void;
  onAddNew: () => void;
  onRefresh: () => void;
}

export const AddressContent = ({
  addresses,
  onEditAddress,
  onAddNew,
  onRefresh,
}: AddressContentProps) => {
  const currentDefaultId = addresses.find((a) => a.is_default)?.id ?? addresses[0]?.id;
  const [selectedId, setSelectedId] = useState(currentDefaultId);
  const [saving, setSaving] = useState(false);
  const hasChanges = selectedId !== currentDefaultId;
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    address: AddressRow | null;
  }>({ isOpen: false, address: null });

  const closeDropdown = useCallback(() => setOpenDropdown(null), []);
  useDropdownClickAway("[data-dropdown]", closeDropdown);

  const handleOpenDeleteModal = (address: AddressRow) => {
    setOpenDropdown(null);
    setDeleteModal({ isOpen: true, address });
  };

  const handleCloseDeleteModal = () => {
    setDeleteModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleModalClosed = () => {
    setDeleteModal({ isOpen: false, address: null });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.address) return;
    setDeleting(true);
    await deleteAddress(deleteModal.address.id);
    setDeleting(false);
    handleCloseDeleteModal();
    onRefresh();
  };

  const handleSaveDefault = async () => {
    if (!selectedId) return;
    const currentDefault = addresses.find((a) => a.is_default);
    if (currentDefault?.id === selectedId) return;

    setSaving(true);
    await setDefaultAddress(selectedId);
    setSaving(false);
    onRefresh();
  };

  const saveDisabled = saving || addresses.length === 0 || !hasChanges;

  return (
    <div className="flex flex-col gap-4 md:gap-2">
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 px-px md:px-0.5">
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
          <p className="text-slate-950 text-sm font-normal font-manrope">Миний хаяг</p>
        </div>

        <p className="px-0 md:px-0.5 pb-0 md:pb-3 text-text-primary font-bold md:font-semibold text-2xl md:text-xl font-manrope">
          Миний хаяг
        </p>
      </div>

      {/* Address List & Actions */}
      <div className="flex flex-col gap-10 px-0.5 pb-10">
        {/* List */}
        <div className="flex flex-col gap-3">
          {addresses.length === 0 ? (
            <div className="flex flex-col items-center justify-center">
              <div className="p-[9px]">
                <LocationBig />
              </div>
              <MutedText>Хүргэх хаягаа оруулаагүй байна</MutedText>
            </div>
          ) : (
            addresses.map((address) => (
              <AddressListItem
                key={address.id}
                address={address}
                isSelected={selectedId === address.id}
                isDropdownOpen={openDropdown === address.id}
                onSelect={() => setSelectedId(address.id)}
                onToggleDropdown={() =>
                  setOpenDropdown(openDropdown === address.id ? null : address.id)
                }
                onEdit={() => {
                  setOpenDropdown(null);
                  onEditAddress(address.id);
                }}
                onRequestDelete={() => handleOpenDeleteModal(address)}
              />
            ))
          )}
        </div>

        {/* Add New Address */}
        <button
          onClick={onAddNew}
          className="flex items-center justify-center px-3 py-2.5 gap-0.5 text-text-primary font-normal text-base font-manrope cursor-pointer"
        >
          <Plus />
          <span className="underline underline-offset-4 decoration-[0.96px] px-0.5">
            Шинэ хаяг нэмэх
          </span>
        </button>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveDefault}
          disabled={saveDisabled}
          className={`bg-text-primary text-white font-normal text-base font-manrope leading-5 px-3 py-2.5 rounded-[4px] transition-colors duration-200 ${
            saveDisabled
              ? "cursor-not-allowed bg-text-primary/30"
              : "cursor-pointer hover:bg-surface-dark"
          }`}
        >
          {saving ? "Хадгалж байна..." : "Хадгалах"}
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        onAnimationEnd={handleModalClosed}
        title="Хаяг устах гэж байна"
        description={`Та "${deleteModal.address?.name || "Хаяг"}" нэртэй хаягаа устгах гэж байна. Итгэлтэй байна уу?`}
        isDeleting={deleting}
      />
    </div>
  );
};
