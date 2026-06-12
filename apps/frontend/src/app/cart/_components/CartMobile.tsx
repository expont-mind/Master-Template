"use client";

import { MutedTextSm, PrimaryMediumBase, PrimaryMediumSm } from "@/components/ui/typography";
import { formatPrice } from "@/lib/utils/formatters";
import { useCartStore } from "@/stores/cart-store";

import { CartItemRowMobile } from "./CartItemRowMobile";

interface EditingVariantInfo {
  cartItemId: string;
  productSlug: string;
  currentVariantId: string;
}

interface CartMobileProps {
  totalCount: number;
  subtotal: number;
  totalDiscount: number;
  deliveryFee: number;
  totalPayable: number;
  onCheckout: () => void;
  onClearCart: () => void;
  onEditVariant: (info: EditingVariantInfo) => void;
}

export function CartMobile({
  totalCount,
  subtotal,
  totalDiscount,
  deliveryFee,
  totalPayable,
  onCheckout,
  onClearCart,
  onEditVariant,
}: CartMobileProps) {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <div className="w-full bg-white flex flex-col pb-20">
      <div className="flex flex-col">
        <p className="pb-2 pt-5 text-text-primary font-bold text-2xl font-manrope  px-4">Сагс</p>

        <div className="flex flex-col gap-3 py-4  px-4">
          <p className="text-text-primary font-bold text-base font-manrope">Төлбөрийн мэдээлэл</p>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <MutedTextSm>Үнийн дүн ({totalCount}ш)</MutedTextSm>
              <PrimaryMediumSm>{formatPrice(subtotal)}</PrimaryMediumSm>
            </div>

            {totalDiscount > 0 && (
              <div className="flex items-center justify-between">
                <MutedTextSm>Нийт хэмнэсэн</MutedTextSm>
                <p className="text-brand-primary font-medium text-sm font-manrope">
                  -{formatPrice(totalDiscount)}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <MutedTextSm>Хүргэлт</MutedTextSm>
              <p
                className={`font-medium text-sm font-manrope ${deliveryFee === 0 ? "text-teal-600" : "text-text-primary"}`}
              >
                {deliveryFee === 0 ? "Үнэгүй" : formatPrice(deliveryFee)}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-text-primary font-bold text-base font-manrope">Нийт төлөх дүн</p>
            <p className="text-text-primary font-bold text-base font-manrope">
              {formatPrice(totalPayable)}
            </p>
          </div>
        </div>

        <div className="py-2">
          <div className="w-full h-px bg-border" />
        </div>

        <div className="flex items-center justify-between py-1  px-4">
          <div className="flex items-center gap-1">
            <p className="text-text-primary font-black text-base font-manrope">{items.length}</p>
            <PrimaryMediumBase>Бүтээгдэхүүн</PrimaryMediumBase>
          </div>
          <button
            onClick={onClearCart}
            className="text-text-secondary font-medium text-sm font-manrope underline underline-offset-2 cursor-pointer"
          >
            Сагс цэвэрлэх
          </button>
        </div>

        <div className="flex flex-col gap-4 pt-3 pb-5 px-4">
          {items.map((item) => (
            <CartItemRowMobile
              key={item.id}
              item={item}
              onQuantityChange={updateQuantity}
              onRemove={removeItem}
              onEditVariant={onEditVariant}
            />
          ))}
        </div>
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-border-light px-4 py-3"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        <button
          onClick={onCheckout}
          className="w-full py-3.5 px-3 bg-text-primary rounded-sm text-white font-normal text-lg font-manrope cursor-pointer hover:bg-surface-dark transition-colors duration-200 text-center"
        >
          Үргэлжлүүлэх
        </button>
      </div>
    </div>
  );
}
