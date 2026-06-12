"use client";

import { PrimaryMediumBase } from "@/components/ui/typography";
import { useCartStore } from "@/stores/cart-store";

import { CartItemRowDesktop } from "./CartItemRowDesktop";
import { CartPaymentSummaryDesktop } from "./CartPaymentSummaryDesktop";

interface CartDesktopProps {
  totalCount: number;
  subtotal: number;
  totalDiscount: number;
  deliveryFee: number;
  couponDiscount: number;
  pointDiscount: number;
  totalPayable: number;
  pointBalance: number | null;
  onCheckout: () => void;
  onClearCart: () => void;
  onOpenCouponModal: () => void;
  onOpenPointModal: () => void;
}

export function CartDesktop(props: CartDesktopProps) {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <div className="w-full bg-white flex justify-center">
      <div className="flex flex-col max-w-[1064px] w-full pb-[52px] px-4 xl:px-0">
        <p className="px-0.5 pb-2 pt-[52px] text-text-primary font-bold text-[26px] leading-9 font-manrope">
          Сагс
        </p>

        <div className="flex flex-row gap-4 items-start">
          <div className="pr-16 pt-1.5 flex flex-col w-full">
            <div className="flex items-center justify-between pb-5">
              <div className="flex items-center gap-1">
                <p className="text-text-primary font-black text-base font-manrope">
                  {items.length}
                </p>
                <PrimaryMediumBase>Бүтээгдэхүүн</PrimaryMediumBase>
              </div>
              <button
                onClick={props.onClearCart}
                className="text-text-secondary font-medium text-sm font-manrope underline underline-offset-2 cursor-pointer hover:text-text-primary transition-colors duration-200 whitespace-nowrap"
              >
                Сагс цэвэрлэх
              </button>
            </div>

            <div className="py-2">
              <div className="w-full h-px bg-border" />
            </div>

            <div className="flex flex-col gap-4 pt-4">
              {items.map((item, index) => (
                <CartItemRowDesktop
                  key={item.id}
                  item={item}
                  showDivider={index < items.length - 1}
                  onQuantityChange={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
            </div>
          </div>

          <CartPaymentSummaryDesktop
            totalCount={props.totalCount}
            subtotal={props.subtotal}
            totalDiscount={props.totalDiscount}
            deliveryFee={props.deliveryFee}
            couponDiscount={props.couponDiscount}
            pointDiscount={props.pointDiscount}
            totalPayable={props.totalPayable}
            pointBalance={props.pointBalance}
            onCheckout={props.onCheckout}
            onOpenCouponModal={props.onOpenCouponModal}
            onOpenPointModal={props.onOpenPointModal}
          />
        </div>
      </div>
    </div>
  );
}
