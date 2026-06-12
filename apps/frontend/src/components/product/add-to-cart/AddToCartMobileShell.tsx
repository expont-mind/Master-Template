"use client";

// Mobile portal shell for AddToCartModal. Handles the backdrop and
// routes between the three mobile phases: accordion, summary, success.

import { AddToCartAccordionPhase } from "./AddToCartAccordionPhase";
import { AddToCartMobileSuccess } from "./AddToCartMobileSuccess";
import { AddToCartSummaryPhase } from "./AddToCartSummaryPhase";

import type { useAddToCartState } from "./_useAddToCartState";

interface AddToCartMobileShellProps {
  state: ReturnType<typeof useAddToCartState>;
  onClose: () => void;
  animate: boolean;
  isDragging: boolean;
  dragY: number;
  drawerTouchProps: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
  getDrawerStyle: (extraTransform?: string) => React.CSSProperties;
}

export function AddToCartMobileShell({
  state,
  onClose,
  animate,
  isDragging,
  dragY,
  drawerTouchProps,
  getDrawerStyle,
}: AddToCartMobileShellProps) {
  return (
    <div className="fixed inset-0 z-999 flex flex-col justify-end">
      <div
        className="absolute inset-0 bg-overlay touch-none"
        style={{
          opacity: isDragging ? Math.max(0, 1 - dragY / 300) : animate ? 1 : 0,
          transition: isDragging ? "none" : "opacity 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {state.hasAddedToCart ? (
        <AddToCartMobileSuccess
          getDrawerStyle={getDrawerStyle}
          drawerTouchProps={drawerTouchProps}
          contentVisible={state.contentVisible}
          onClose={onClose}
          hasVariants={state.hasVariants}
          cartItems={state.cartItems}
          variants={state.variants}
          resolvedProduct={state.resolvedProduct}
          hasOptionGroups={state.hasOptionGroups}
          optionGroups={state.optionGroups}
          selectedVariant={state.selectedVariant}
          displayImage={state.displayImage}
          displayName={state.displayName}
          currentPrice={state.currentPrice}
          currentDiscountPrice={state.currentDiscountPrice}
          discount={state.discount}
          sellingPrice={state.sellingPrice}
        />
      ) : state.mobilePhase === "accordion" ? (
        <AddToCartAccordionPhase
          contentVisible={state.contentVisible}
          getDrawerStyle={getDrawerStyle}
          drawerTouchProps={drawerTouchProps}
          hasVariants={state.hasVariants}
          hasOptionGroups={state.hasOptionGroups}
          allAccordionGroups={state.allAccordionGroups}
          variants={state.variants}
          selectedOptions={state.selectedOptions}
          selectedVariantId={state.selectedVariantId}
          expandedGroupIndex={state.expandedGroupIndex}
          setExpandedGroupIndex={state.setExpandedGroupIndex}
          isOptionOutOfStock={state.isOptionOutOfStock}
          getOptionImage={state.getOptionImage}
          handleAccordionOptionSelect={state.handleAccordionOptionSelect}
          handleSkipOptionalGroup={state.handleSkipOptionalGroup}
          handleAccordionVariantSelect={state.handleAccordionVariantSelect}
        />
      ) : (
        <AddToCartSummaryPhase
          contentVisible={state.contentVisible}
          getDrawerStyle={getDrawerStyle}
          drawerTouchProps={drawerTouchProps}
          hasVariants={state.hasVariants}
          hasOptionGroups={state.hasOptionGroups}
          optionGroups={state.optionGroups}
          variants={state.variants}
          resolvedProduct={state.resolvedProduct}
          cartItems={state.cartItems}
          quantity={state.quantity}
          canDecrease={state.canDecrease}
          canIncrease={state.canIncrease}
          currentPrice={state.currentPrice}
          currentDiscountPrice={state.currentDiscountPrice}
          currentStock={state.currentStock}
          discount={state.discount}
          sellingPrice={state.sellingPrice}
          displayImage={state.displayImage}
          displayName={state.displayName}
          totalPrice={state.totalPrice}
          onBackToAccordion={state.backToAccordion}
          onEditCartItem={state.editCartItem}
          onCartItemQuantityChange={state.handleCartItemQuantityChange}
          onRemoveCartItem={state.handleRemoveCartItem}
          onQuantityChange={state.handleQuantityChange}
          onClose={onClose}
          onAddToCart={state.handleMobileAddToCart}
        />
      )}
    </div>
  );
}
