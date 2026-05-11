"use client";

import { useState, useEffect } from "react";
import type { Database } from "@/types/database";
import { Plus, MoreVerticalBig, LocationBig, Slash } from "../svg";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { DeleteModal } from "./DeleteModal";

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
  const currentDefaultId =
    addresses.find((a) => a.is_default)?.id ?? addresses[0]?.id;
  const [selectedId, setSelectedId] = useState(currentDefaultId);
  const [saving, setSaving] = useState(false);
  const hasChanges = selectedId !== currentDefaultId;
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    address: AddressRow | null;
  }>({ isOpen: false, address: null });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Close dropdown if clicking outside dropdown area
      if (!target.closest("[data-dropdown]")) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    const supabase = createClient();
    await supabase.from("addresses").delete().eq("id", deleteModal.address.id);
    setDeleting(false);
    handleCloseDeleteModal();
    onRefresh();
  };

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
          <p className="text-slate-950 text-sm font-normal font-manrope">
            Миний хаяг
          </p>
        </div>

        <p className="px-0 md:px-0.5 pb-0 md:pb-3 text-[#020617] font-bold md:font-semibold text-2xl md:text-xl font-manrope">
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
              <p className="text-[#64748B] font-normal text-base font-manrope">
                Хүргэх хаягаа оруулаагүй байна
              </p>
            </div>
          ) : (
            addresses.map((address) => {
              const general = [
                address.city,
                address.district,
                address.sub_district,
              ]
                .filter(Boolean)
                .join(", ");

              return (
                <div
                  key={address.id}
                  className="bg-white border border-[#E2E8F0] rounded-[4px] flex items-center gap-3 md:gap-4 pl-3 md:pl-4 pr-3 md:pr-6 py-3 md:py-4 cursor-pointer"
                  onClick={() => setSelectedId(address.id)}
                >
                  <div className="p-1 border border-[#E2E8F0] rounded-full shadow-[0_1px_2px_0_rgba(0,0,0,0.10)]">
                    <div
                      className={`w-2 h-2 rounded-full transition-all duration-200 ease-in-out ${
                        selectedId === address.id
                          ? "bg-[#020617] scale-100"
                          : "bg-white scale-0"
                      }`}
                    ></div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      {address.name && (
                        <span className="text-[#020617] font-semibold text-sm font-manrope">
                          {address.name}
                        </span>
                      )}
                      {address.is_default && (
                        <span className="bg-[#F1F5F9] text-[#020617] font-bold text-xs font-manrope leading-4 px-2 pt-0.5 pb-1 rounded-sm">
                          Үндсэн
                        </span>
                      )}
                    </div>
                    {general && (
                      <p className="text-[#64748B] font-medium text-base font-manrope leading-6 truncate">
                        {general}
                      </p>
                    )}
                    {address.detail && (
                      <p className="text-[#020617] font-medium text-lg font-manrope leading-7">
                        {address.detail}
                      </p>
                    )}
                  </div>

                  {/* More Button & Dropdown */}
                  <div className="relative" data-dropdown>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdown(
                          openDropdown === address.id ? null : address.id,
                        );
                      }}
                      className="w-10 h-10 flex items-center justify-center cursor-pointer hover:bg-[#F8FAFC] rounded transition-colors"
                    >
                      <MoreVerticalBig />
                    </button>

                    <div
                      className={`absolute right-0 top-full bg-white border p-1 border-[#E2E8F0] rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.10)] z-10 w-[128px] transition-all duration-200 origin-top-right ${
                        openDropdown === address.id
                          ? "opacity-100 scale-100 pointer-events-auto"
                          : "opacity-0 scale-95 pointer-events-none"
                      }`}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdown(null);
                          onEditAddress(address.id);
                        }}
                        className="w-full text-left rounded-md px-2 py-1.5 text-[#020617] font-normal text-sm font-manrope hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                      >
                        Засах
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDeleteModal(address);
                        }}
                        className="w-full text-left rounded-md px-2 py-1.5 text-[#020617] font-normal text-sm font-manrope hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                      >
                        Устгах
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add New Address */}
        <button
          onClick={onAddNew}
          className="flex items-center justify-center px-3 py-2.5 gap-0.5 text-[#020617] font-normal text-base font-manrope cursor-pointer"
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
          onClick={async () => {
            if (!selectedId) return;
            const currentDefault = addresses.find((a) => a.is_default);
            if (currentDefault?.id === selectedId) return;

            setSaving(true);
            const supabase = createClient();
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
              setSaving(false);
              return;
            }

            // Remove default from all addresses
            await supabase
              .from("addresses")
              .update({ is_default: false })
              .eq("user_id", user.id);

            // Set new default
            await supabase
              .from("addresses")
              .update({ is_default: true })
              .eq("id", selectedId);

            setSaving(false);
            onRefresh();
          }}
          disabled={saving || addresses.length === 0 || !hasChanges}
          className={`bg-[#020617] text-white font-normal text-base font-manrope leading-5 px-3 py-2.5 rounded-[4px] transition-colors duration-200 ${
            saving || addresses.length === 0 || !hasChanges
              ? "cursor-not-allowed bg-[rgba(2,6,23,0.30)]"
              : "cursor-pointer hover:bg-[#1E293B]"
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
