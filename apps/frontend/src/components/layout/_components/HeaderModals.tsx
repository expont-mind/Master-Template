"use client";

import { useRouter } from "next/navigation";

import { AddressSelectModal } from "@/components/checkout/AddressSelectModal";
import { MobileCategoryMenu } from "@/components/layout/MobileCategoryMenu";
import { PointGiftModal } from "@/components/profile/PointGiftModal";
import { SearchModal } from "@/components/search/SearchModal";
import { useUIStore } from "@/stores/ui-store";

import type { AddressWithId } from "@/lib/hooks/useCheckout";

interface HeaderModalsProps {
  isSearchOpen: boolean;
  onSearchClose: () => void;
  isAddressModalOpen: boolean;
  onAddressModalClose: () => void;
  allAddresses: AddressWithId[];
  defaultAddressId: string | null;
  onAddressSelect: (id: string) => void;
  isMobileCategoryOpen: boolean;
  onMobileCategoryClose: () => void;
}

export function HeaderModals({
  isSearchOpen,
  onSearchClose,
  isAddressModalOpen,
  onAddressModalClose,
  allAddresses,
  defaultAddressId,
  onAddressSelect,
  isMobileCategoryOpen,
  onMobileCategoryClose,
}: HeaderModalsProps) {
  const router = useRouter();
  const { pointGiftModal, closePointGiftModal } = useUIStore();

  return (
    <>
      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={onSearchClose} />

      {/* Address Select Modal */}
      <AddressSelectModal
        isOpen={isAddressModalOpen}
        onClose={onAddressModalClose}
        addresses={allAddresses}
        selectedAddressId={defaultAddressId}
        onSelect={(address) => {
          onAddressSelect(address.id);
        }}
        onEdit={(address) => {
          router.push(`/profile?tab=address&action=edit&id=${address.id}`);
        }}
        onAddNew={() => {
          router.push("/profile?tab=address&action=new");
        }}
      />

      {/* Mobile Category Menu */}
      <MobileCategoryMenu isOpen={isMobileCategoryOpen} onClose={onMobileCategoryClose} />

      {/* Point Gift Modal */}
      {pointGiftModal && (
        <PointGiftModal
          isOpen={pointGiftModal.isOpen}
          onClose={closePointGiftModal}
          onViewBalance={() => {
            closePointGiftModal();
            router.push("/profile?tab=point");
          }}
          amount={pointGiftModal.amount}
          description={pointGiftModal.description}
        />
      )}
    </>
  );
}
